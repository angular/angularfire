import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { asWindowsPath, normalize } from '@angular-devkit/core';
import { SchematicContext, Tree, chain } from '@angular-devkit/schematics';
import { addRootProvider } from '@schematics/angular/utility';
import { getFirebaseTools } from '../firebaseTools';
import {
  DataConnectConnectorConfig,
  DeployOptions, FEATURES, FirebaseApp, FirebaseJSON, FirebaseProject,
} from '../interfaces';
import {
  addIgnoreFiles,
  featureToRules,
  getFirebaseProjectNameFromHost,
  getProject,
  parseDataConnectConfig,
  setupTanstackDependencies,
} from '../utils';
import { appPrompt, featuresPrompt, projectPrompt, userPrompt } from './prompts';

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
    
    let firebaseJson: FirebaseJSON = JSON.parse(
      readFileSync(join(projectRoot, "firebase.json")).toString()
    );

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

    const setupConfig: SetupConfig = {
      ...options, firebaseProject, firebaseApp, sdkConfig,
      firebaseJsonConfig: firebaseJson,
      firebaseJsonPath: projectRoot
    };
    if (features.length) {

      firebaseApp = await appPrompt(firebaseProject, undefined, { projectRoot });

      const result = await firebaseTools.apps.sdkconfig('web', firebaseApp.appId, { nonInteractive: true, projectRoot });
      sdkConfig = result.sdkConfig;
      delete sdkConfig.locationId;
      setupConfig.sdkConfig = sdkConfig;
      setupConfig.firebaseApp = firebaseApp;
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
            context.logger.info('Generated Angular SDK Enabled. Setting up Tanstack Dependencies.');
            setupTanstackDependencies(host, context);
          } else {
            context.logger.info('Generated Angular SDK Disabled. Please add `angular: true` to your connector.yaml and re-run `ng add @angular/fire`');
          }
          setupConfig.dataConnectConfig = dataConnectConfig;
        }
      
    }

    return setupProject(host, context, features, setupConfig);
  }
};
