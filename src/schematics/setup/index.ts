import { writeFileSync } from 'fs';
import { join } from 'path';
import { asWindowsPath, normalize } from '@angular-devkit/core';
import { SchematicContext, Tree, chain } from '@angular-devkit/schematics';
import { addRootProvider } from '@schematics/angular/utility';
import { getFirebaseTools } from '../firebaseTools';
import {
  DeployOptions, FEATURES, FirebaseApp, FirebaseHostingSite, FirebaseProject,
} from '../interfaces';
import {
  addIgnoreFiles,
  featureToRules,
  getFirebaseProjectNameFromHost,
  getProject,
} from '../utils';
import { appPrompt, featuresPrompt, projectPrompt, userPrompt } from './prompts';

export interface SetupConfig extends DeployOptions {
  firebaseProject: FirebaseProject,
  firebaseApp?: FirebaseApp,
  firebaseHostingSite?: FirebaseHostingSite,
  sdkConfig?: Record<string, string>,
  buildTarget?: [string, string],
  serveTarget?: [string, string],
  project?: string,
  ssrRegion?: string,
}

export const setupProject =
  (tree: Tree, context: SchematicContext, features: FEATURES[], config: SetupConfig) => {
    const { projectName } = getProject(config, tree);

    addIgnoreFiles(tree);

    if (features.length) {
      return chain([
        addRootProvider(projectName, ({code, external}) => {
          external('initializeApp', '@angular/fire/app');
          return code`${external('provideFirebaseApp', '@angular/fire/app')}(() => initializeApp(${JSON.stringify(config.sdkConfig)}))`;
        }),
        ...featureToRules(features, projectName),
      ]);
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
    const defaultUser = await firebaseTools.login(options);
    if (user.email !== defaultUser?.email) {
      await firebaseTools.login.use(user.email, { projectRoot });
    }

    const { projectName: ngProjectName } = getProject(options, host);

    const [ defaultProjectName ] = getFirebaseProjectNameFromHost(host, ngProjectName);

    const firebaseProject = await projectPrompt(defaultProjectName, { projectRoot, account: user.email });
    
    let firebaseApp: FirebaseApp|undefined;
    let sdkConfig: Record<string, string>|undefined;

    if (features.length) {

      firebaseApp = await appPrompt(firebaseProject, undefined, { projectRoot });

      const result = await firebaseTools.apps.sdkconfig('web', firebaseApp.appId, { nonInteractive: true, projectRoot });
      sdkConfig = result.sdkConfig;

    }

    return setupProject(host, context, features, {
      ...options, firebaseProject, firebaseApp, sdkConfig,
    });

  }
};
