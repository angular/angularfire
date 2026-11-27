import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { asWindowsPath, normalize } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree, chain } from '@angular-devkit/schematics';
import { addRootProvider } from '@schematics/angular/utility';
import {
  BuildTargetDefinition, browserOutputDirectory, clientSidePage, localizedBuildHostingWarning,
  productionBuildOptions, rendersOnServer,
} from '../buildOptions.js';
import { shortSiteName } from '../common.js';
import { getActiveAccount, getFirebaseTools } from '../firebaseTools.js';
import { hostingSiteFromRc, hostingSitesOfOtherTargets } from '../firebaserc.js';
import {
  DataConnectConnectorConfig,
  DeployChoice, DeployOptions, FEATURES, FirebaseApp, FirebaseJSON, FirebaseProject, FirebaseTools,
  WorkspaceProject,
} from '../interfaces.js';
import {
  addIgnoreFiles,
  featureToRules,
  getProject,
  getWorkspace,
  parseDataConnectConfig,
  setupTanstackDependencies,
} from '../utils.js';
import { appHostingRequirements, assertAppHostingSetupSupported, selectAppHostingBackend } from './appHosting.js';
import {
  deployBuilder,
  existingAppHostingBackend,
  existingDeployChoice,
  existingFirebaseProject,
  firebaseProjectForDeployOption,
  firebaseRcForSetup,
  setAppHostingInFirebaseJson,
  setDeployTarget,
  setHostingInFirebaseJson,
  setHostingTargetInFirebaseRc,
  unnamedHostingEntryToReplace,
} from './deployConfigs.js';
import { deployPrompt, sitePrompt } from './deployPrompts.js';
import { warnAboutDuplicateFirebase } from './duplicateWarning.js';
import {
  addFirestoreToFirebaseJson,
  createFirestoreStarterFiles,
  setDefaultProjectInFirebaseRc,
} from './firebaseConfigs.js';
import {
  appPrompt, confirmPrompt, featuresPrompt, featuresPromptMessage, projectPrompt, userPrompt,
} from './prompts.js';

// FirebaseOptions keys — apps.sdkconfig responses include management-API extras that initializeApp() rejects.
const firebaseOptionsKeys = [
  'apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket',
  'messagingSenderId', 'appId', 'measurementId', 'recaptchaSiteKey',
];

export interface SetupConfig extends DeployOptions {
  firebaseProject: FirebaseProject,
  firebaseApp?: FirebaseApp,
  sdkConfig?: Record<string, string>,
  firebaseJsonConfig?: FirebaseJSON;
  dataConnectConfig?: DataConnectConnectorConfig | null;
  firebaseJsonPath: string;
}

export const setupProject =
  (tree: Tree, context: SchematicContext, features: FEATURES[], config: SetupConfig) => {
    const { projectName } = getProject(config, tree);

    addIgnoreFiles(tree);

    if (features.length) {
      return chain([
        addRootProvider(projectName, ({code, external}) => {
          external('initializeApp', '@angular/fire/app');
          return code`${external('provideFirebaseApp', '@angular/fire/app')}(() => initializeApp(${
            config.sdkConfig ? `{ ${Object.entries(config.sdkConfig).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")} }` : ""
          }))`;
        }),
        ...featureToRules(features, projectName, config.dataConnectConfig),
      ]);
    }
};

/**
 * `firebase.json` can hold a lone Hosting entry with no target name, which is what
 * `firebase init hosting` writes. Setting up Hosting would turn that entry into this Angular
 * project's entry, and it may be there for something else, so this asks the user first.
 * @returns false when the user wants that entry left alone, after telling them how to go on.
 *   True when they agree, and when there is no such entry to ask about.
 */
const mayReplaceUnnamedHostingEntry = async (
  projectRoot: string,
  angularProjectName: string,
  context: SchematicContext,
): Promise<boolean> => {
  const unnamedEntry = unnamedHostingEntryToReplace(projectRoot, angularProjectName);
  if (!unnamedEntry) { return true; }

  const servedDirectory = unnamedEntry.public ? ` (it serves "${unnamedEntry.public}")` : '';
  const replace = await confirmPrompt(
    `firebase.json has a Hosting entry with no target name${servedDirectory}. ` +
    `Use that entry for the app "${angularProjectName}"? Its settings will be changed to serve this app.`,
  );
  if (replace) { return true; }

  context.logger.info(
    'Deployment was not set up. To keep that Hosting entry for something else, give it a "target" ' +
    'name in firebase.json and link that name to its site with "firebase target:apply hosting ' +
    '<name> <site id>". Then run ng add @angular/fire again and choose a different site for this app.'
  );
  return false;
};

/**
 * Decides where `ng deploy` should deploy the app: the `--deploy` option when it was given,
 * otherwise the user's answer. The cursor starts on what the project already deploys with, so
 * that pressing Enter changes nothing. For a project with no deploy setup yet, it starts on App
 * Hosting when the app uses server-side rendering and on Hosting when it does not.
 *
 * Returns `none` when the user declines one of the two questions that follow a deploy answer:
 * replacing another tool's `deploy` entry, and using a lone Hosting entry with no target name.
 * @param projectRoot the workspace root on disk
 */
const chooseDeployChoice = async (
  options: DeployOptions,
  ngProject: WorkspaceProject,
  angularProjectName: string,
  projectRoot: string,
  context: SchematicContext,
): Promise<DeployChoice> => {
  const rendersPagesOnServer = rendersOnServer(productionBuildOptions(ngProject.architect?.build));
  const choiceForNewSetup: DeployChoice = rendersPagesOnServer ? 'apphosting' : 'hosting';
  const preselected = existingDeployChoice(ngProject.architect?.deploy) ?? choiceForNewSetup;

  const choice = options.deploy ?? await deployPrompt(preselected);
  if (choice === 'none') { return choice; }

  // Setting up deployment overwrites the project's `deploy` entry, which may belong to another tool.
  const existingDeployBuilder = ngProject.architect?.deploy?.builder;
  if (existingDeployBuilder && existingDeployBuilder !== deployBuilder) {
    const replace = await confirmPrompt(
      `This project already deploys with ${existingDeployBuilder}. Replace that deploy target?`,
    );
    if (!replace) {
      context.logger.info('Keeping the existing deploy target. Deployment was not set up.');
      return 'none';
    }
  }

  // Asked here, before the sign-in and project questions, because a no ends the deploy setup.
  if (choice === 'hosting' && !await mayReplaceUnnamedHostingEntry(projectRoot, angularProjectName, context)) {
    return 'none';
  }

  return choice;
};

/** The place `ng deploy` will deploy to: a Firebase Hosting site, or a Firebase App Hosting backend. */
type DeployDestination =
  | { kind: 'hosting', siteId: string }
  | { kind: 'apphosting', backendId: string, alwaysDeployFromSource: boolean };

/** What `chooseDeployDestination` needs to know about the `ng add` run it is part of. */
interface DeployDestinationRequest {
  /** The Firebase project chosen earlier in the run. */
  firebaseProject: FirebaseProject;
  /** The web app chosen earlier in the run. A new App Hosting backend is linked to it. */
  firebaseApp: FirebaseApp | undefined;
  /** The workspace root on disk. */
  projectRoot: string;
  /** The email of the signed-in Firebase account. */
  account: string;
  /** The Angular project being set up. Its name is also its Hosting target name. */
  angularProjectName: string;
  /** The App Hosting backend the Angular project's `deploy` entry already deploys to, if any. */
  existingBackendId: string | undefined;
}

/**
 * Asks which Hosting site or which App Hosting backend to deploy to, according to
 * `deployChoice`, creating it when the user asks for a new one. Returns undefined when there is
 * nothing to deploy to: the choice was `none`, or the user backed out along the way.
 */
const chooseDeployDestination = async (
  deployChoice: DeployChoice,
  firebaseTools: FirebaseTools,
  context: SchematicContext,
  request: DeployDestinationRequest,
): Promise<DeployDestination | undefined> => {
  const { firebaseProject, firebaseApp, projectRoot, account, angularProjectName, existingBackendId } = request;

  if (deployChoice === 'hosting') {
    const firebaseRc = firebaseRcForSetup(projectRoot);
    const { projectId } = firebaseProject;
    const existingSiteId = hostingSiteFromRc(firebaseRc, projectId, angularProjectName);
    const otherTargetBySite = hostingSitesOfOtherTargets(firebaseRc, projectId, angularProjectName);
    const site = await sitePrompt(firebaseProject, projectRoot, existingSiteId, otherTargetBySite);
    const siteId = shortSiteName(site);
    return siteId ? { kind: 'hosting', siteId } : undefined;
  }

  if (deployChoice === 'apphosting' && firebaseApp) {
    const backend = await selectAppHostingBackend(firebaseTools, context, {
      projectId: firebaseProject.projectId,
      projectRoot,
      account,
      webAppId: firebaseApp.appId,
      angularProjectName,
      existingBackendId,
    });
    if (backend) { return { kind: 'apphosting', ...backend }; }

    context.logger.info('Deployment was not set up.');
  }

  return undefined;
};

/** What `writeFirebaseDeployConfig` needs to know about the workspace it writes to. */
interface FirebaseDeployConfigRequest {
  /** The workspace root on disk. */
  projectRoot: string;
  /** The Firebase project being deployed to. */
  projectId: string;
  /** The Angular project being set up. Its name is also its Hosting target name. */
  angularProjectName: string;
  /** The Angular project's `build` entry from angular.json. */
  buildTarget: BuildTargetDefinition | undefined;
  /** Whether angular.json has an application besides this Angular project. */
  hasOtherApplications: boolean;
}

/** Whether the workspace's angular.json has an application other than `angularProjectName`. */
const workspaceHasOtherApplications = (host: Tree, angularProjectName: string): boolean => {
  const { workspace } = getWorkspace(host);
  return Object.entries(workspace.projects).some(
    ([projectName, project]) => projectName !== angularProjectName && project.projectType === 'application'
  );
};

/**
 * Writes the chosen deploy destination into the Firebase CLI's two files on disk, firebase.json
 * and .firebaserc. The `deploy` entry in angular.json is written separately, through the Tree.
 */
const writeFirebaseDeployConfig = (
  destination: DeployDestination,
  context: SchematicContext,
  request: FirebaseDeployConfigRequest,
): void => {
  const { projectRoot, projectId, angularProjectName, buildTarget, hasOtherApplications } = request;

  if (destination.kind === 'apphosting') {
    setAppHostingInFirebaseJson(projectRoot, destination.backendId, destination.alwaysDeployFromSource);

    // App Hosting builds with the `build` script and is not told which Angular project to build.
    if (hasOtherApplications) {
      context.logger.warn(
        'This workspace has more than one application. Firebase App Hosting builds the app by ' +
        'running "npm run build", so make sure the build script in package.json builds ' +
        `"${angularProjectName}", for example "ng build ${angularProjectName}".`
      );
    }
    return;
  }

  // Firebase Hosting serves files, so it needs to know where the build puts them.
  const buildOptions = productionBuildOptions(buildTarget);
  setHostingTargetInFirebaseRc(projectRoot, projectId, angularProjectName, destination.siteId);
  setHostingInFirebaseJson(
    projectRoot,
    angularProjectName,
    browserOutputDirectory(angularProjectName, buildTarget),
    clientSidePage(buildOptions),
  );

  if (rendersOnServer(buildOptions)) {
    context.logger.warn(
      'This app uses server-side rendering, which Firebase Hosting cannot run: every route that ' +
      'is not prerendered will load as a client-rendered page. Choose Firebase App Hosting to ' +
      'keep server-side rendering.'
    );
  }

  if (buildOptions.localize) { context.logger.warn(localizedBuildHostingWarning); }
};

export const ngAddSetupProject = (
  options: DeployOptions
) => async (host: Tree, context: SchematicContext) => {

  // TODO is there a public API for this?
  let projectRoot: string = (host as any)._backend._root;
  if (process.platform.startsWith('win32')) { projectRoot = asWindowsPath(normalize(projectRoot)); }

  /* Before the prompt, so it runs whatever the user selects, and after the install task this
   * schematic is scheduled behind, so node_modules is on disk to be queried. */
  warnAboutDuplicateFirebase(projectRoot, context);

  const features = await featuresPrompt();

  const { project: ngProject, projectName: ngProjectName } = getProject(options, host);
  const deployChoice = await chooseDeployChoice(options, ngProject, ngProjectName, projectRoot, context);

  /* Said in both branches below. Pressing Enter at the features prompt without pressing Space
   * first selects nothing, which is easy to do by mistake. */
  const howToSelectFeatures =
    `At the "${featuresPromptMessage}" prompt, use the arrow keys to move, ` +
    'press Space to select each feature you want, then Enter to confirm.';

  if (features.length === 0 && deployChoice === 'none') {
    context.logger.warn(
      'No features were selected and no deployment was set up, so there is nothing to do. ' +
      `${howToSelectFeatures} Re-run ng add @angular/fire to try again.`
    );
  } else {

    if (features.length === 0) {
      context.logger.info(
        'No features were selected, so only deployment is being set up. To add features, run ' +
        `ng add @angular/fire again. ${howToSelectFeatures}`
      );
    }

    const firebaseTools = await getFirebaseTools();

    // Before any Firebase call, so an unsupported firebase-tools changes nothing.
    if (deployChoice === 'apphosting') { assertAppHostingSetupSupported(firebaseTools); }

    // Add the firebase files if they don't exist already so login.use works
    if (!host.exists('/firebase.json')) { writeFileSync(join(projectRoot, 'firebase.json'), '{}'); }

    let firebaseJson: FirebaseJSON = JSON.parse(
      readFileSync(join(projectRoot, "firebase.json")).toString()
    );

    const user = await userPrompt({ projectRoot });
    const defaultUser = await getActiveAccount(firebaseTools, projectRoot);
    if (user.email !== defaultUser?.email) {
      await firebaseTools.login.use(user.email, { projectRoot });
    }

    // The question starts on the project `ng deploy` uses today, so that pressing Enter keeps it.
    const firebaseRcAtStart = firebaseRcForSetup(projectRoot);
    const startingProject = existingFirebaseProject(ngProject.architect?.deploy, firebaseRcAtStart, ngProjectName);
    const firebaseProject = await projectPrompt(startingProject, { projectRoot, account: user.email });

    let firebaseApp: FirebaseApp|undefined;
    let sdkConfig: Record<string, string>|undefined;

    const setupConfig: SetupConfig = {
      ...options, firebaseProject, firebaseApp, sdkConfig,
      firebaseJsonConfig: firebaseJson,
      firebaseJsonPath: projectRoot
    };

    if (deployChoice === 'apphosting') {
      context.logger.info(appHostingRequirements(firebaseProject.projectId));
    }

    // An App Hosting backend is linked to a web app, so App Hosting needs one even with no features.
    if (features.length || deployChoice === 'apphosting') {
      firebaseApp = await appPrompt(firebaseProject, undefined, { projectRoot });
      setupConfig.firebaseApp = firebaseApp;
    }

    /* The deploy destination is chosen, and created when new, before the Data Connect init below
     * writes files. A failure here stops only the deploy setup. The run goes on, so the selected
     * features are still set up, as they are when the user declines a deploy question. */
    let deployDestination: DeployDestination | undefined;
    try {
      deployDestination = await chooseDeployDestination(deployChoice, firebaseTools, context, {
        firebaseProject,
        firebaseApp,
        projectRoot,
        account: user.email,
        angularProjectName: ngProjectName,
        existingBackendId: existingAppHostingBackend(ngProject.architect?.deploy),
      });
    } catch (error) {
      context.logger.warn(
        `Deployment was not set up: ${error.message}\n` +
        'Run ng add @angular/fire again to set up deployment.'
      );
    }

    if (features.length && firebaseApp) {

      const result = await firebaseTools.apps.sdkconfig('web', firebaseApp.appId, { nonInteractive: true, projectRoot });
      sdkConfig = Object.fromEntries(
        firebaseOptionsKeys
          .filter(key => result.sdkConfig[key] !== undefined)
          .map(key => [key, result.sdkConfig[key]])
      );
      setupConfig.sdkConfig = sdkConfig;
      // set up data connect locally if data connect hasn't already been initialized.
      if(features.includes(FEATURES.DataConnect)) {
        if (!firebaseJson.dataconnect) {
          try {
            await firebaseTools.init("dataconnect", {
              projectRoot,
              project: firebaseProject.projectId,
            });
            // Update firebaseJson values to include newly added dataconnect field in firebase.json.
            firebaseJson = JSON.parse(
              readFileSync(join(projectRoot, "firebase.json")).toString()
            );
            setupConfig.firebaseJsonConfig = firebaseJson;
          } catch (e) {
            console.error(e);
          }
        }
          let dataConnectConfig = parseDataConnectConfig(setupConfig);
          if(!dataConnectConfig?.connectorYaml.generate?.javascriptSdk) {
            await firebaseTools.init("dataconnect:sdk", {
              projectRoot,
              project: firebaseProject.projectId,
            });
          }
          // Parse through sdk again
          dataConnectConfig = parseDataConnectConfig(setupConfig);
          if(dataConnectConfig?.angular) {
            context.logger.info('Generated Angular SDK Enabled.');
          } else {
            context.logger.info('Generated Angular SDK Disabled. Please add `angular: true` to your connector.yaml');
          }
          setupTanstackDependencies(host, context);
          setupConfig.dataConnectConfig = dataConnectConfig;
        }

    }

    // Read after the init calls, never before — firebase-tools rewrites firebase.json on disk
    // mid-run. A failed read isn't fatal: createFirestoreStarterFiles falls back to checking the
    // disk for each file it would create.
    let firebaseJsonAfterInit: FirebaseJSON | undefined;
    try {
      firebaseJsonAfterInit = JSON.parse(
        readFileSync(join(projectRoot, "firebase.json")).toString()
      );
    } catch (e) {
      context.logger.warn(`Could not re-read firebase.json after setup (${e.message}).`);
    }
    // Must run before addFirestoreToFirebaseJson: that call adds the firestore section, and if it
    // ran first this snapshot would see it and skip creating the files it points at.
    createFirestoreStarterFiles(host, context, features, firebaseJsonAfterInit);

    /* An App Hosting deploy goes to the default project. When this run set up no deployment, an
     * App Hosting setup from an earlier run has to keep deploying where it did, so the default
     * project stays as it was. */
    const earlierDefaultProject = firebaseRcAtStart.projects?.default;
    const keepsAppHostingProject =
      !deployDestination && !!existingAppHostingBackend(ngProject.architect?.deploy) && !!earlierDefaultProject;
    const defaultProject = keepsAppHostingProject ? earlierDefaultProject : firebaseProject.projectId;
    if (keepsAppHostingProject && earlierDefaultProject !== firebaseProject.projectId) {
      context.logger.warn(
        `ng deploy still deploys this app to the Firebase project ${earlierDefaultProject}, which ` +
        'stays the default project in .firebaserc because deployment was not set up in this run.'
      );
    }

    // Both write the real filesystem, after the last firebaseTools.init call — init writes
    // .firebaserc and rewrites firebase.json on disk during the run.
    setDefaultProjectInFirebaseRc(projectRoot, defaultProject);
    addFirestoreToFirebaseJson(projectRoot, context, features);

    // After the calls above for the same reason: these also write firebase.json and .firebaserc on disk.
    if (deployDestination) {
      writeFirebaseDeployConfig(deployDestination, context, {
        projectRoot,
        projectId: firebaseProject.projectId,
        angularProjectName: ngProjectName,
        buildTarget: ngProject.architect?.build,
        hasOtherApplications: workspaceHasOtherApplications(host, ngProjectName),
      });
    }

    // The edits to the app's own files, made through the Tree: the providers, then the deploy entry.
    const rules: Rule[] = [];
    const featureRule = setupProject(host, context, features, setupConfig);
    if (featureRule) { rules.push(featureRule); }
    if (deployDestination) {
      const appHostingBackend = deployDestination.kind === 'apphosting' ? deployDestination.backendId : undefined;

      // Only a Hosting setup needs the `firebaseProject` option. This reads the .firebaserc written above.
      let firebaseProjectOption: string | undefined;
      if (deployDestination.kind === 'hosting') {
        firebaseProjectOption = firebaseProjectForDeployOption(projectRoot, firebaseProject.projectId, ngProjectName);
      }

      const deployTargetSettings = { appHostingBackend, firebaseProject: firebaseProjectOption };
      rules.push(setDeployTarget(ngProjectName, deployTargetSettings));
      context.logger.info('Deployment is set up. Run ng deploy to deploy your app.');
    }
    return chain(rules);
  }
};
