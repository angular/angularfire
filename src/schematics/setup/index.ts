import { asWindowsPath, normalize } from '@angular-devkit/core';
import { SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  getWorkspace, getProject, getFirebaseProjectNameFromHost, addEnvironmentEntry,
  addToNgModule, addIgnoreFiles, addFixesToServer
} from '../utils';
import { projectTypePrompt, appPrompt, sitePrompt, projectPrompt, featuresPrompt, userPrompt } from './prompts';
import {
  FirebaseApp, FirebaseHostingSite, FirebaseProject, DeployOptions, NgAddNormalizedOptions,
  FEATURES, PROJECT_TYPE
} from '../interfaces';
import { getFirebaseTools } from '../firebaseTools';
import { writeFileSync } from 'fs';
import { join } from 'path';
import {
  generateFirebaseRc,
  overwriteIfExists,
  safeReadJSON,
  stringifyFormatted
} from '../common';
import { FirebaseJSON, Workspace, WorkspaceProject } from '../interfaces';

export interface SetupConfig extends DeployOptions {
  firebaseProject: FirebaseProject,
  firebaseApp?: FirebaseApp,
  firebaseHostingSite?: FirebaseHostingSite,
  sdkConfig?: Record<string, string>,
  nodeVersion?: string,
  browserTarget?: string,
  serverTarget?: string,
  prerenderTarget?: string,
  project: string,
  ssrRegion?: string,
  projectType?: PROJECT_TYPE,
  prerender?: boolean,
}; 

export const setupProject =
  async (tree: Tree, context: SchematicContext, features: FEATURES[], config: SetupConfig) => {
    const { path: workspacePath, workspace } = getWorkspace(tree);

    const { project, projectName } = getProject(config, tree);

    const sourcePath = project.sourceRoot ?? project.root;

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
      prerender: undefined,
      browserTarget: config.browserTarget,
      serverTarget: config.serverTarget,
      prerenderTarget: config.prerenderTarget,
      ssrRegion: config.ssrRegion,
    };

    if (features.includes(FEATURES.Hosting)) {
      return setupFirebase({
        workspace,
        workspacePath,
        options,
        tree,
        context,
        project
      });
    } else {
      return Promise.resolve();
    }
};

export const ngAddSetupProject = (
  options: DeployOptions
) => async (host: Tree, context: SchematicContext) => {

  // TODO is there a public API for this?
  let projectRoot: string = (host as any)._backend._root;
  if (process.platform.startsWith('win32')) { projectRoot = asWindowsPath(normalize(projectRoot)); }

  const features = await featuresPrompt();

  if (features.length > 0) {

    const firebaseTools = await getFirebaseTools();

    // Add the firebase files if they don't exist already so login.use works
    if (!host.exists('/firebase.json')) { writeFileSync(join(projectRoot, 'firebase.json'), '{}'); }

    const user = await userPrompt({ projectRoot });
    await firebaseTools.login.use(user.email, { projectRoot });

    const { project: ngProject, projectName: ngProjectName } = getProject(options, host);

    const [ defaultProjectName ] = getFirebaseProjectNameFromHost(host, ngProjectName);

    const firebaseProject = await projectPrompt(defaultProjectName, { projectRoot, account: user.email });

    let hosting = { };
    let firebaseHostingSite: FirebaseHostingSite|undefined;

    if (features.includes(FEATURES.Hosting)) {
      // TODO read existing settings from angular.json, if available
      const results = await projectTypePrompt(ngProject, ngProjectName);
      hosting = { ...hosting, ...results };
      firebaseHostingSite = await sitePrompt(firebaseProject, { projectRoot });
    }

    let firebaseApp: FirebaseApp|undefined;
    let sdkConfig: Record<string, string>|undefined;

    if (features.find(it => it !== FEATURES.Hosting)) {

      const defaultAppId = firebaseHostingSite?.appId;
      firebaseApp = await appPrompt(firebaseProject, defaultAppId, { projectRoot });

      const result = await firebaseTools.apps.sdkconfig('web', firebaseApp.appId, { nonInteractive: true, projectRoot });
      sdkConfig = result.sdkConfig;

    }

    await setupProject(host, context, features, {
      ...options, ...hosting, firebaseProject, firebaseApp, firebaseHostingSite, sdkConfig,
    });

  }
};

export function generateFirebaseJson(
  tree: Tree,
  path: string,
  project: string,
  region: string|undefined,
) {
  const firebaseJson: FirebaseJSON = tree.exists(path)
    ? safeReadJSON(path, tree)
    : {};

  const newConfig = {
    target: project,
    source: '.',
    frameworksBackend: {
      region
    }
  };
  if (firebaseJson.hosting === undefined) {
    firebaseJson.hosting = [newConfig];
  } else if (Array.isArray(firebaseJson.hosting)) {
    const existingConfigIndex = firebaseJson.hosting.findIndex(config => config.target === newConfig.target);
    if (existingConfigIndex > -1) {
      firebaseJson.hosting.splice(existingConfigIndex, 1, newConfig);
    } else {
      firebaseJson.hosting.push(newConfig);
    }
  } else {
    firebaseJson.hosting = [firebaseJson.hosting, newConfig];
  }

  overwriteIfExists(tree, path, stringifyFormatted(firebaseJson));
}

export const setupFirebase = (config: {
  project: WorkspaceProject;
  options: NgAddNormalizedOptions;
  workspacePath: string;
  workspace: Workspace;
  tree: Tree;
  context: SchematicContext;
}) => {
  const { tree, workspacePath, workspace, options } = config;
  const project = workspace.projects[options.project];

  if (!project.architect) {
    throw new SchematicsException(`Angular project "${options.project}" has a malformed angular.json`);
  }

  project.architect.deploy = {
    builder: '@angular/fire:deploy',
    options: {
      version: 2,
      browserTarget: options.browserTarget,
      ...(options.serverTarget ? {serverTarget: options.serverTarget} : {}),
      ...(options.prerenderTarget ? {prerenderTarget: options.prerenderTarget} : {})
    }
  };

  tree.overwrite(workspacePath, JSON.stringify(workspace, null, 2));

  generateFirebaseJson(tree, 'firebase.json', options.project, options.ssrRegion);
  generateFirebaseRc(
    tree,
    '.firebaserc',
    options.firebaseProject.projectId,
    options.firebaseHostingSite,
    options.project
  );

  return tree;
};
