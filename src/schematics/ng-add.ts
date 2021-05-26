import { SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  projectPrompt, getWorkspace, getProject, projectTypePrompt, appPrompt, sitePrompt, getFirebaseTools, getFirebaseProjectName,
  featuresPrompt, PROJECT_TYPE
} from './utils';
import { DeployOptions, NgAddNormalizedOptions } from './ng-add-common';
import { setupUniversalDeployment } from './ng-add-ssr';
import { addFirebaseHostingDependencies, setupStaticDeployment } from './ng-add-static';
import { FirebaseApp, FirebaseHostingSite, FirebaseProject } from './interfaces';

export const setupProject =
  async (tree: Tree, context: SchematicContext, config: DeployOptions & {
    firebaseProject: FirebaseProject,
    firebaseApp: FirebaseApp,
    firebaseHostingSite: FirebaseHostingSite|undefined,
    sdkConfig: {[key: string]: any}
    projectType: PROJECT_TYPE,
    prerender: boolean,
    nodeVersion: string|undefined,
  }) => {
    const { path: workspacePath, workspace } = getWorkspace(tree);

    const { project, projectName } = getProject(config, tree);

    const options: NgAddNormalizedOptions = {
      project: projectName,
      firebaseProject: config.firebaseProject,
      firebaseApp: config.firebaseApp,
      firebaseHostingSite: config.firebaseHostingSite,
      sdkConfig: config.sdkConfig,
      prerender: config.prerender,
    };

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
};

export const ngAddSetupProject = (
  options: DeployOptions
) => async (host: Tree, context: SchematicContext) => {

  // I'm not able to resolve dependencies.... this is definately some sort of race condition.
  // Failing on bluebird but there are a lot of things that aren't right. Error for now.
  try {
    require('firebase-tools');
  } catch (e) {
    throw new Error('The NodePackageInstallTask does not appear to have completed successfully or we ran into a race condition. Please run the `ng add @angular/fire` command again.');
  }

  await featuresPrompt();

  const firebase = getFirebaseTools();
  await firebase.login();

  // TODO get the default project name from the tree, rather than FS
  const { project: ngProject, projectName: ngProjectName } = getProject(options, host);
  const defaultProjectName = getFirebaseProjectName('./', ngProjectName);

  const firebaseProject = await projectPrompt(defaultProjectName);

  const { projectType, prerender, nodeVersion } = await projectTypePrompt(ngProject);

  // TODO get default site from tree
  const firebaseHostingSite = await sitePrompt(firebaseProject);

  // TODO get default app from tree (environment config)
  const firebaseApp = await appPrompt(firebaseProject);
  const { sdkConfig } = await firebase.apps.sdkconfig('web', firebaseApp.appId, { nonInteractive: true });

  await setupProject(host, context, {
    ...options, firebaseProject, firebaseApp, firebaseHostingSite, sdkConfig, projectType, prerender, nodeVersion
  });

};

export const ngAdd = addFirebaseHostingDependencies;
