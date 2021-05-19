import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { projectPrompt, getWorkspace, getProject, projectTypePrompt, appPrompt, sitePrompt, getFirebaseTools, getFirebaseProjectName } from './utils';
import { DeployOptions, NgAddNormalizedOptions } from './ng-add-common';
import { addFirebaseFunctionsDependencies, setupUniversalDeployment } from './ng-add-ssr';
import { addFirebaseHostingDependencies, setupStaticDeployment } from './ng-add-static';
import { FirebaseApp, FirebaseHostingSite, FirebaseProject } from './interfaces';

export const setupProject =
  async (host: Tree, context: SchematicContext, options: DeployOptions & {
    firebaseProject: FirebaseProject,
    firebaseApp: FirebaseApp,
    firebaseHostingSite: FirebaseHostingSite,
    sdkConfig: {[key: string]: any}
    universalProject: boolean
  }) => {
    const { path: workspacePath, workspace } = getWorkspace(host);

    const {project, projectName} = getProject(options, host);

    const config: NgAddNormalizedOptions = {
      project: projectName,
      firebaseProject: options.firebaseProject,
      firebaseApp: options.firebaseApp,
      firebaseHostingSite: options.firebaseHostingSite,
      sdkConfig: options.sdkConfig,
    };

    if (options.universalProject) {
      return setupUniversalDeployment({
        workspace,
        workspacePath,
        options: config,
        tree: host,
        project
      });
    } else {
      return setupStaticDeployment({
        workspace,
        workspacePath,
        options: config,
        tree: host,
        project
      });
    }
};

const DEFAULT_SITE_TYPE = 'DEFAULT_SITE';

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

  const firebase = getFirebaseTools();
  await firebase.login();

  // TODO get the default project name from the tree, rather than FS
  const { project: ngProject, projectName: ngProjectName } = getProject(options, host);
  const defaultProjectName = getFirebaseProjectName('./', ngProjectName);

  const firebaseProject = await projectPrompt(defaultProjectName);

  // start fetching sites & apps now that we have a projectId
  const sites = firebase.hosting.sites.list({ project: firebaseProject.projectId }).then(it => it.sites);
  const apps = firebase.apps.list('web', { project: firebaseProject.projectId });

  const { universalProject } = await projectTypePrompt(ngProject);

  // TODO get default site from tree
  const firebaseHostingSite = await sitePrompt(sites, firebaseProject);

  // TODO get default app from tree (environment config)
  const firebaseApp = await appPrompt(apps, firebaseProject);
  const { sdkConfig } = await firebase.apps.sdkconfig('web', firebaseApp.appId, { nonInteractive: true });

  await setupProject(host, context, { ...options, firebaseProject, firebaseApp, firebaseHostingSite, sdkConfig, universalProject });

};

export const ngAdd = addFirebaseHostingDependencies;
