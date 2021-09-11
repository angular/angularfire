import { SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  projectPrompt, getWorkspace, getProject, projectTypePrompt, appPrompt, sitePrompt, getFirebaseTools, getFirebaseProjectNameFromHost,
  featuresPrompt, PROJECT_TYPE, FEATURES,
} from './utils';
import { setupUniversalDeployment } from './ng-add-ssr';
import { addFirebaseHostingDependencies, setupStaticDeployment } from './ng-add-static';
import { FirebaseApp, FirebaseHostingSite, FirebaseProject, DeployOptions, NgAddNormalizedOptions } from './interfaces';

export const setupProject =
  async (tree: Tree, context: SchematicContext, features: FEATURES[], config: DeployOptions & {
    firebaseProject: FirebaseProject,
    firebaseApp: FirebaseApp|undefined,
    firebaseHostingSite: FirebaseHostingSite|undefined,
    sdkConfig: Record<string, string>|undefined,
    projectType: PROJECT_TYPE,
    prerender: boolean,
    nodeVersion?: string,
    browserTarget?: string,
    serverTarget?: string,
    prerenderTarget?: string,
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
  // I'm not able to resolve dependencies.... this is definately some sort of race condition.
  // Failing on bluebird but there are a lot of things that aren't right. Error for now.
  try {
    getFirebaseTools();
  } catch (e) {
    throw new Error('The NodePackageInstallTask does not appear to have completed successfully or we ran into a race condition. Please run the `ng add @angular/fire` command again.');
  }

  const features = await featuresPrompt();

  if (features.length > 0) {

    const firebase = getFirebaseTools();

    await firebase.login();

    const { project: ngProject, projectName: ngProjectName } = getProject(options, host);

    const [ defaultProjectName, defaultHostingSite ] = getFirebaseProjectNameFromHost(host, ngProjectName);

    const firebaseProject = await projectPrompt(defaultProjectName);

    let hosting = { projectType: PROJECT_TYPE.Static, prerender: false };
    let firebaseHostingSite: FirebaseHostingSite|undefined;

    if (features.includes(FEATURES.Hosting)) {
      // TODO read existing settings from angular.json, if available
      const results = await projectTypePrompt(ngProject, ngProjectName);
      hosting = { ...hosting, ...results };
      firebaseHostingSite = await sitePrompt(firebaseProject, defaultHostingSite);
    }

    let firebaseApp: FirebaseApp|undefined;
    let sdkConfig: Record<string, string>|undefined;

    if (features.find(it => it !== FEATURES.Hosting)) {

      const defaultAppId = firebaseHostingSite?.appId;
      firebaseApp = await appPrompt(firebaseProject, defaultAppId);

      const result = await firebase.apps.sdkconfig('web', firebaseApp.appId, { nonInteractive: true });
      sdkConfig = result.sdkConfig;

    }

    await setupProject(host, context, features, {
      ...options, ...hosting, firebaseProject, firebaseApp, firebaseHostingSite, sdkConfig,
    });

  }
};

export const ngAdd = addFirebaseHostingDependencies;
