import { readFileSync } from 'fs';
import { join } from 'path';
import { Rule, SchematicsException, Tree, chain } from '@angular-devkit/schematics';
import { addRootProvider } from '@schematics/angular/utility';
import { overwriteIfExists } from './common';
import { DeployOptions, FEATURES, FirebaseApp, FirebaseRc, Workspace } from './interfaces';

export const shortAppId = (app?: FirebaseApp) => app?.appId?.split('/').pop();

export function getWorkspace(
  host: Tree
): { path: string; workspace: Workspace } {
  const path = '/angular.json';

  const configBuffer = path && host.read(path);
  if (!configBuffer) {
    throw new SchematicsException(`Could not find angular.json`);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { parse } = require('jsonc-parser');

  const workspace = parse(configBuffer.toString()) as Workspace|undefined;
  if (!workspace) {
    throw new SchematicsException('Could not parse angular.json');
  }

  return {
    path,
    workspace
  };
}

export const getProject = (options: DeployOptions, host: Tree) => {
  const { workspace } = getWorkspace(host);
  const projectName = options.project || workspace.defaultProject;

  if (!projectName) {
    throw new SchematicsException(
      'No Angular project selected and no default project in the workspace'
    );
  }

  const project = workspace.projects[projectName];
  if (!project) {
    throw new SchematicsException(
      'The specified Angular project is not defined in this workspace'
    );
  }

  if (project.projectType !== 'application') {
    throw new SchematicsException(
      `Deploy requires an Angular project type of "application" in angular.json`
    );
  }

  return {project, projectName};
};

export function getFirebaseProjectNameFromHost(
  host: Tree,
  target: string
): [string|undefined, string|undefined] {
  const buffer = host.read('/.firebaserc');
  if (!buffer) {
    return [undefined, undefined];
  }
  const rc: FirebaseRc = JSON.parse(buffer.toString());
  return projectFromRc(rc, target);
}

export function getFirebaseProjectNameFromFs(
  root: string,
  target: string
): [string|undefined, string|undefined] {
  const path = join(root, '.firebaserc');
  try {
    const buffer = readFileSync(path);
    const rc: FirebaseRc = JSON.parse(buffer.toString());
    return projectFromRc(rc, target);
  } catch (e) {
    return [undefined, undefined];
  }
}

export const projectFromRc = (rc: FirebaseRc, target: string): [string|undefined, string|undefined] => {
  if (!rc.targets) {
    return [undefined, undefined];
  }

  const project = rc.projects?.default || Object.keys(rc.targets)[0];
  if (!project) {
    return [undefined, undefined];
  }

  return [project, rc.targets[project].hosting[target][0]];
};

// TODO rewrite using typescript
export function addFixesToServer(host: Tree) {
  const serverPath = `/server.ts`;

  if (!host.exists(serverPath)) {
    return host;
  }

  const text = host.read(serverPath);
  if (text === null) {
    throw new SchematicsException(`File ${serverPath} does not exist.`);
  }
  const sourceText = text.toString('utf-8');
  const addZonePatch = !sourceText.includes('import \'zone.js/dist/zone-patch-rxjs\';');

  if (addZonePatch) {
    overwriteIfExists(host, serverPath, sourceText.replace('import \'zone.js/dist/zone-node\';', `import 'zone.js/dist/zone-node';
${addZonePatch ? 'import \'zone.js/dist/zone-patch-rxjs\';' : ''}`));
  }

  return host;
}

export function featureToRules(features: FEATURES[], projectName: string) {
  return features.map(feature => {
    switch (feature) {
        case FEATURES.AppCheck:
          // TODO make this smarter in Angular Universal
          return addRootProvider(projectName, ({code, external}) => {
            external('initializeAppCheck', '@angular/fire/app-check');
            external('ReCaptchaEnterpriseProvider', '@angular/fire/app-check');
            return code`${external('provideAppCheck', '@angular/fire/app-check')}(() => {
  // TODO get a reCAPTCHA Enterprise here https://console.cloud.google.com/security/recaptcha?project=_
  const provider = new ReCaptchaEnterpriseProvider(/* reCAPTCHA Enterprise site key */);
  return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
})`;
          });
        case FEATURES.Analytics:
          return chain([
            addRootProvider(projectName, ({code, external}) => {
              external('getAnalytics', '@angular/fire/analytics');
              return code`${external('provideAnalytics', '@angular/fire/analytics')}(() => getAnalytics())`;
            }),
            // TODO if using Angular router
            addRootProvider(projectName, ({code, external}) => {
              return code`${external('ScreenTrackingService', '@angular/fire/analytics')}`;
            }),
            ...(features.includes(FEATURES.Authentication) ? [
              addRootProvider(projectName, ({code, external}) => {
                return code`${external('UserTrackingService', '@angular/fire/analytics')}`;
              })
            ] : []),
          ])
        case FEATURES.Authentication:
          return addRootProvider(projectName, ({code, external}) => {
            external('getAuth', '@angular/fire/auth');
            return code`${external('provideAuth', '@angular/fire/auth')}(() => getAuth())`;
          });
        case FEATURES.Database:
          return addRootProvider(projectName, ({code, external}) => {
            external('getDatabase', '@angular/fire/database');
            return code`${external('provideDatabase', '@angular/fire/database')}(() => getDatabase())`;
          });
        case FEATURES.DataConnect:
          throw "unimplemented.";
        //  TODO need to add the generation of the project, grab the connector config
        //  that requires this go async
        //  return addRootProvider(projectName, ({code, external}) => {
        //    external('getDataConnect', '@angular/fire/data-connect');
        //    return code`${external('provideDataConnect', '@angular/fire/data-connect')}(() => getDataConnect())`;
        //  });
        case FEATURES.Firestore:
          return addRootProvider(projectName, ({code, external}) => {
            external('getFirestore', '@angular/fire/firestore');
            return code`${external('provideFirestore', '@angular/fire/firestore')}(() => getFirestore())`;
          });
        case FEATURES.Functions:
          return addRootProvider(projectName, ({code, external}) => {
            external('getFunctions', '@angular/fire/functions');
            return code`${external('provideFunctions', '@angular/fire/functions')}(() => getFunctions())`;
          });
        case FEATURES.Messaging:
          // TODO add the service worker
          return addRootProvider(projectName, ({code, external}) => {
            external('getMessaging', '@angular/fire/messaging');
            return code`${external('provideMessaging', '@angular/fire/messaging')}(() => getMessaging())`;
          });
        case FEATURES.Performance:
          return addRootProvider(projectName, ({code, external}) => {
            external('getPerformance', '@angular/fire/performance');
            return code`${external('providePerformance', '@angular/fire/performance')}(() => getPerformance())`;
          });
        case FEATURES.Storage:
          return addRootProvider(projectName, ({code, external}) => {
            external('getStorage', '@angular/fire/storage');
            return code`${external('provideStorage', '@angular/fire/storage')}(() => getStorage())`;
          });
        case FEATURES.RemoteConfig:
          // TODO consider downloading the defaults
          return addRootProvider(projectName, ({code, external}) => {
            external('getRemoteConfig', '@angular/fire/remote-config');
            return code`${external('provideRemoteConfig', '@angular/fire/remote-config')}(() => getRemoteConfig())`;
          });
        case FEATURES.VertexAI:
          return addRootProvider(projectName, ({code, external}) => {
            external('getVertexAI', '@angular/fire/vertexai');
            return code`${external('provideVertexAI', '@angular/fire/vertexai')}(() => getVertexAI())`;
          });
        default:
          return undefined;
      }
  }).filter((it): it is Rule => !!it);
}

export const addIgnoreFiles = (host: Tree) => {
  const path = '/.gitignore';
  if (!host.exists(path)) {
    return host;
  }

  const buffer = host.read(path);
  if (!buffer) {
    return host;
  }

  const content = buffer.toString();
  if (!content.includes('# Firebase')) {
    overwriteIfExists(host, path, content.concat(`
# Firebase
.firebase
*-debug.log
.runtimeconfig.json
`));
  }

  return host;
};
