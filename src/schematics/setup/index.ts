import { SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  getWorkspace, getProject, getFirebaseProjectNameFromHost, addEnvironmentEntry,
  addToNgModule, addIgnoreFiles, addFixesToServer
} from '../utils';
import { projectTypePrompt, appPrompt, sitePrompt, projectPrompt, featuresPrompt, userPrompt } from './prompts';
import { setupUniversalDeployment } from './ssr';
import { setupStaticDeployment } from './static';
import {
  FirebaseApp, FirebaseHostingSite, FirebaseProject, DeployOptions, NgAddNormalizedOptions,
  FEATURES, PROJECT_TYPE
} from '../interfaces';
import { getFirebaseTools } from '../firebaseTools';
import { overwriteIfExists } from '../common';
import { writeFileSync } from 'fs';

export const setupProject =
  async (tree: Tree, context: SchematicContext, features: FEATURES[], config: DeployOptions & {
    firebaseProject: FirebaseProject,
    firebaseApp?: FirebaseApp,
    firebaseHostingSite?: FirebaseHostingSite,
    sdkConfig?: Record<string, string>,
    projectType: PROJECT_TYPE,
    prerender: boolean,
    nodeVersion?: string,
    browserTarget?: string,
    serverTarget?: string,
    prerenderTarget?: string,
    project: string,
  }) => {
    const { path: workspacePath, workspace } = getWorkspace(tree);

    const { project, projectName } = getProject(config, tree);

    const sourcePath = [project.root, project.sourceRoot].filter(it => !!it).join('/');

    addIgnoreFiles(tree);

    const featuresToImport = features.filter(it => it !== FEATURES.Hosting);
    if (featuresToImport.length > 0) {
      addToNgModule(tree, { features: featuresToImport, sourcePath });
      addFixesToServer(tree, { features: featuresToImport, sourcePath });
    }

    if (config.sdkConfig) {
      const source = `
  firebase: {
${Object.entries(config.sdkConfig).reduce(
    (c, [k, v]) => c.concat(`    ${k}: '${v}'`),
    [] as string[]
).join(',\n')},
  }`;

      const environmentPath = `${sourcePath}/environments/environment.ts`;
      addEnvironmentEntry(tree, `/${environmentPath}`, source);

      // Iterate over the replacements for the environment file and add the config
      Object.values(project.architect || {}).forEach(builder => {
        Object.values(builder.configurations || {}).forEach(configuration => {
          (configuration.fileReplacements || []).forEach((replacement: any) => {
            if (replacement.replace === environmentPath) {
              addEnvironmentEntry(tree, `/${replacement.with}`, source);
            }
          });
        });
      });
    }

    const options: NgAddNormalizedOptions = {
      project: projectName,
      firebaseProject: config.firebaseProject,
      firebaseApp: config.firebaseApp,
      firebaseHostingSite: config.firebaseHostingSite,
      sdkConfig: config.sdkConfig,
      prerender: config.prerender,
      browserTarget: config.browserTarget,
      serverTarget: config.serverTarget,
      prerenderTarget: config.prerenderTarget,
    };

    if (features.includes(FEATURES.Hosting)) {
      // TODO dry up by always doing the static work
      switch (config.projectType) {
        case PROJECT_TYPE.CloudFunctions:
        case PROJECT_TYPE.CloudRun:
          return setupUniversalDeployment({
            workspace,
            workspacePath,
            options,
            tree,
            context,
            project,
            projectType: config.projectType,
            // tslint:disable-next-line:no-non-null-assertion
            nodeVersion: config.nodeVersion!,
          });
        case PROJECT_TYPE.Static:
          return setupStaticDeployment({
            workspace,
            workspacePath,
            options,
            tree,
            context,
            project
          });
        default: throw(new SchematicsException(`Unimplemented PROJECT_TYPE ${config.projectType}`));
      }
    }
};

export const ngAddSetupProject = (
  options: DeployOptions
) => async (host: Tree, context: SchematicContext) => {

  const features = await featuresPrompt();

  if (features.length > 0) {

    const firebaseTools = await getFirebaseTools();

    // Add the firebase files if they don't exist already so login.use works
    if (!host.exists('/firebase.json')) { writeFileSync('firebase.json', '{}'); }

    const user = await userPrompt();
    await firebaseTools.login.use(user.email);

    const { project: ngProject, projectName: ngProjectName } = getProject(options, host);

    const [ defaultProjectName ] = getFirebaseProjectNameFromHost(host, ngProjectName);

    const firebaseProject = await projectPrompt(defaultProjectName);

    let hosting = { projectType: PROJECT_TYPE.Static, prerender: false };
    let firebaseHostingSite: FirebaseHostingSite|undefined;

    if (features.includes(FEATURES.Hosting)) {
      // TODO read existing settings from angular.json, if available
      const results = await projectTypePrompt(ngProject, ngProjectName);
      hosting = { ...hosting, ...results };
      firebaseHostingSite = await sitePrompt(firebaseProject);
    }

    let firebaseApp: FirebaseApp|undefined;
    let sdkConfig: Record<string, string>|undefined;

    if (features.find(it => it !== FEATURES.Hosting)) {

      const defaultAppId = firebaseHostingSite?.appId;
      firebaseApp = await appPrompt(firebaseProject, defaultAppId);

      const result = await firebaseTools.apps.sdkconfig('web', firebaseApp.appId, { nonInteractive: true });
      sdkConfig = result.sdkConfig;

    }

    await setupProject(host, context, features, {
      ...options, ...hosting, firebaseProject, firebaseApp, firebaseHostingSite, sdkConfig,
    });

  }
};
