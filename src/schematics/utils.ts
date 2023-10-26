import { readFileSync } from 'fs';
import { join } from 'path';
import { Rule, SchematicsException, Tree, chain } from '@angular-devkit/schematics';
import ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import { addRootImport, addRootProvider } from '@schematics/angular/utility';
import { findNode } from '@schematics/angular/utility/ast-utils';
import { InsertChange, ReplaceChange, applyToUpdateRecorder } from '@schematics/angular/utility/change';
import { overwriteIfExists } from './common';
import { DeployOptions, FEATURES, FirebaseApp, FirebaseRc, Workspace, WorkspaceProject } from './interfaces';

// We consider a project to be a universal project if it has a `server` architect
// target. If it does, it knows how to build the application's server.
export const isUniversalApp = (
  project: WorkspaceProject
) => project.architect?.server;

export const hasPrerenderOption = (
  project: WorkspaceProject
) => project.architect?.prerender;

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

const projectFromRc = (rc: FirebaseRc, target: string): [string|undefined, string|undefined] => {
  const defaultProject = rc.projects?.default;
  const project = Object.keys(rc.targets || {}).find(
    project => !!rc.targets?.[project]?.hosting?.[target]
  );
  const site = project && rc.targets?.[project]?.hosting?.[target]?.[0];
  return [project || defaultProject, site];
};

/**
 * Adds a package to the package.json
 */
export function addEnvironmentEntry(
  host: Tree,
  filePath: string,
  data: string,
): Tree {
  const fileExists = host.exists(filePath);
  if (fileExists) {
    const buffer = host.read(filePath);
    if (!buffer) {
      throw new SchematicsException(`Cannot read ${filePath}`);
    }
    const sourceFile = ts.createSourceFile(filePath, buffer.toString('utf-8'), ts.ScriptTarget.Latest, true);

    const envIdentifier = findNode(sourceFile as any, ts.SyntaxKind.Identifier, 'environment');
    if (!envIdentifier?.parent) {
      throw new SchematicsException(`Cannot find 'environment' identifier in ${filePath}`);
    }

    const envObjectLiteral = envIdentifier.parent.getChildren().find(({ kind }) => kind === ts.SyntaxKind.ObjectLiteralExpression);
    if (!envObjectLiteral) {
      throw new SchematicsException(`${filePath} is not in the expected format`);
    }
    const firebaseIdentifier = findNode(envObjectLiteral, ts.SyntaxKind.Identifier, 'firebase');

    const recorder = host.beginUpdate(filePath);
    if (firebaseIdentifier?.parent) {
      const change = new ReplaceChange(filePath, firebaseIdentifier.parent.pos, firebaseIdentifier.parent.getFullText(), data);
      applyToUpdateRecorder(recorder, [change]);
    } else {
      const openBracketToken = envObjectLiteral.getChildren().find(({ kind }) => kind === ts.SyntaxKind.OpenBraceToken);
      if (openBracketToken) {
        const change = new InsertChange(filePath, openBracketToken.end, `${data},`);
        applyToUpdateRecorder(recorder, [change]);
      } else {
        throw new SchematicsException(`${filePath} is not in the expected format`);
      }
    }
    host.commitUpdate(recorder);
  } else {
    host.create(filePath, `export const environment = {${data},
};`);
  }

  return host;
}

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
          return addRootImport(projectName, ({code, external}) => {
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
            addRootImport(projectName, ({code, external}) => {
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
          return addRootImport(projectName, ({code, external}) => {
            external('getAuth', '@angular/fire/auth');
            return code`${external('provideAuth', '@angular/fire/auth')}(() => getAuth())`;
          });
        case FEATURES.Database:
          return addRootImport(projectName, ({code, external}) => {
            external('getDatabase', '@angular/fire/database');
            return code`${external('provideDatabase', '@angular/fire/database')}(() => getDatabase())`;
          });
        case FEATURES.Firestore:
          return addRootImport(projectName, ({code, external}) => {
            external('getFirestore', '@angular/fire/firestore');
            return code`${external('provideFirestore', '@angular/fire/firestore')}(() => getFirestore())`;
          });
        case FEATURES.Functions:
          return addRootImport(projectName, ({code, external}) => {
            external('getFunctions', '@angular/fire/functions');
            return code`${external('provideFunctions', '@angular/fire/functions')}(() => getFunctions())`;
          });
        case FEATURES.Messaging:
          // TODO add the service worker
          return addRootImport(projectName, ({code, external}) => {
            external('getMessaging', '@angular/fire/messaging');
            return code`${external('provideMessaging', '@angular/fire/messaging')}(() => getMessaging())`;
          });
        case FEATURES.Performance:
          return addRootImport(projectName, ({code, external}) => {
            external('getPerformance', '@angular/fire/performance');
            return code`${external('providePerformance', '@angular/fire/performance')}(() => getPerformance())`;
          });
        case FEATURES.Storage:
          return addRootImport(projectName, ({code, external}) => {
            external('getStorage', '@angular/fire/storage');
            return code`${external('provideStorage', '@angular/fire/storage')}(() => getStorage())`;
          });
        case FEATURES.RemoteConfig:
          // TODO consider downloading the defaults
          return addRootImport(projectName, ({code, external}) => {
            external('getRemoteConfig', '@angular/fire/remote-config');
            return code`${external('provideRemoteConfig', '@angular/fire/remote-config')}(() => getRemoteConfig())`;
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
