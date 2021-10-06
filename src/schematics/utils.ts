import { readFileSync } from 'fs';
import { FirebaseRc, Workspace, WorkspaceProject, FirebaseApp, DeployOptions, FEATURES } from './interfaces';
import { join } from 'path';
import { SchematicsException, Tree } from '@angular-devkit/schematics';
import ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import { findNode, addImportToModule, addProviderToModule, insertImport } from '@schematics/angular/utility/ast-utils';
import { InsertChange, ReplaceChange, applyToUpdateRecorder, Change } from '@schematics/angular/utility/change';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { overwriteIfExists } from './common';

// We consider a project to be a universal project if it has a `server` architect
// target. If it does, it knows how to build the application's server.
export const isUniversalApp = (
  project: WorkspaceProject
) => project.architect?.server;

export const hasPrerenderOption = (
  project: WorkspaceProject
) => project.architect?.prerender;

export const shortAppId = (app?: FirebaseApp) => app?.appId && app.appId.split('/').pop();

export function getWorkspace(
  host: Tree
): { path: string; workspace: Workspace } {
  const path = '/angular.json';

  const configBuffer = path && host.read(path);
  if (!configBuffer) {
    throw new SchematicsException(`Could not find angular.json`);
  }

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
  if (!host.exists(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }

  const buffer = host.read(filePath);
  if (!buffer) {
    throw new SchematicsException(`Cannot read ${filePath}`);
  }
  const sourceFile = ts.createSourceFile(filePath, buffer.toString('utf-8'), ts.ScriptTarget.Latest, true);

  const envIdentifier = findNode(sourceFile as any, ts.SyntaxKind.Identifier, 'environment');
  if (!envIdentifier || !envIdentifier.parent) {
    throw new SchematicsException(`Cannot find 'environment' identifier in ${filePath}`);
  }

  const envObjectLiteral = envIdentifier.parent.getChildren().find(({ kind }) => kind === ts.SyntaxKind.ObjectLiteralExpression);
  if (!envObjectLiteral) {
    throw new SchematicsException(`${filePath} is not in the expected format`);
  }
  const firebaseIdentifier = findNode(envObjectLiteral, ts.SyntaxKind.Identifier, 'firebase');

  const recorder = host.beginUpdate(filePath);
  if (firebaseIdentifier && firebaseIdentifier.parent) {
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

  return host;
}

// TODO rewrite using typescript
export function addFixesToServer(host: Tree, options: { sourcePath: string, features: FEATURES[]}) {
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
  const addFirestorePatch = options.features.includes(FEATURES.Firestore) &&
    !sourceText.includes('import \'@angular/fire/firestore-protos\';');

  if (addZonePatch || addFirestorePatch) {
    overwriteIfExists(host, serverPath, sourceText.replace('import \'zone.js/dist/zone-node\';', `import 'zone.js/dist/zone-node';
${addZonePatch ? 'import \'zone.js/dist/zone-patch-rxjs\';' : ''}
${addFirestorePatch ? 'import \'@angular/fire/firestore-protos\';' : ''}`));
  }

  return host;
}

export function addToNgModule(host: Tree, options: { sourcePath: string, features: FEATURES[]}) {

  const modulePath = `/${options.sourcePath}/app/app.module.ts`;

  if (!host.exists(modulePath)) {
    throw new Error(`Specified module path ${modulePath} does not exist`);
  }

  const text = host.read(modulePath);
  if (text === null) {
    throw new SchematicsException(`File ${modulePath} does not exist.`);
  }
  const sourceText = text.toString('utf-8');

  const source = ts.createSourceFile(
    modulePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  const environmentsPath = buildRelativePath(
    modulePath,
    `/${options.sourcePath}/environments/environment`
  );

  const changes: Array<Change> = [];

  if (!findNode(source, ts.SyntaxKind.Identifier, 'provideFirebaseApp')) {
    changes.push(
      insertImport(source, modulePath, ['initializeApp', 'provideFirebaseApp'] as any, '@angular/fire/app'),
      insertImport(source, modulePath, 'environment', environmentsPath),
      ...addImportToModule(source, modulePath, `provideFirebaseApp(() => initializeApp(environment.firebase))`, null as any),
    );
  }

  if (
    options.features.includes(FEATURES.Analytics) &&
    !findNode(source, ts.SyntaxKind.Identifier, 'provideAnalytics')
  ) {
    changes.push(
      insertImport(source, modulePath, ['provideAnalytics', 'getAnalytics', 'ScreenTrackingService', 'UserTrackingService'] as any, '@angular/fire/analytics'),
      ...addImportToModule(source, modulePath, `provideAnalytics(() => getAnalytics())`, null as any),
      ...addProviderToModule(source, modulePath, `ScreenTrackingService`, null as any),
      ...addProviderToModule(source, modulePath, `UserTrackingService`, null as any),
    );
  }

  if (
    options.features.includes(FEATURES.Authentication) &&
    !findNode(source, ts.SyntaxKind.Identifier, 'provideAuth')
  ) {
    changes.push(
      insertImport(source, modulePath, ['provideAuth', 'getAuth'] as any, '@angular/fire/auth'),
      ...addImportToModule(source, modulePath, `provideAuth(() => getAuth())`, null as any),
    );
  }

  if (
    options.features.includes(FEATURES.Database) &&
    !findNode(source, ts.SyntaxKind.Identifier, 'provideDatabase')
  ) {
    changes.push(
      insertImport(source, modulePath, ['provideDatabase', 'getDatabase'] as any, '@angular/fire/database'),
      ...addImportToModule(source, modulePath, `provideDatabase(() => getDatabase())`, null as any),
    );
  }

  if (
    options.features.includes(FEATURES.Firestore) &&
    !findNode(source, ts.SyntaxKind.Identifier, 'provideFirestore')
  ) {
    changes.push(
      insertImport(source, modulePath, ['provideFirestore', 'getFirestore'] as any, '@angular/fire/firestore'),
      ...addImportToModule(source, modulePath, `provideFirestore(() => getFirestore())`, null as any),
    );
  }

  if (
    options.features.includes(FEATURES.Functions) &&
    !findNode(source, ts.SyntaxKind.Identifier, 'provideFunctions')
  ) {
    changes.push(
      insertImport(source, modulePath, ['provideFunctions', 'getFunctions'] as any, '@angular/fire/functions'),
      ...addImportToModule(source, modulePath, `provideFunctions(() => getFunctions())`, null as any),
    );
  }

  if (
    options.features.includes(FEATURES.Messaging) &&
    !findNode(source, ts.SyntaxKind.Identifier, 'provideMessaging')
  ) {
    // TODO add the service worker
    changes.push(
      insertImport(source, modulePath, ['provideMessaging', 'getMessaging'] as any, '@angular/fire/messaging'),
      ...addImportToModule(source, modulePath, `provideMessaging(() => getMessaging())`, null as any),
    );
  }

  if (
    options.features.includes(FEATURES.Performance) &&
    !findNode(source, ts.SyntaxKind.Identifier, 'providePerformance')
  ) {
    // TODO performance monitor service
    changes.push(
      insertImport(source, modulePath, ['providePerformance', 'getPerformance'] as any, '@angular/fire/performance'),
      ...addImportToModule(source, modulePath, `providePerformance(() => getPerformance())`, null as any),
    );
  }

  if (
    options.features.includes(FEATURES.RemoteConfig) &&
    !findNode(source, ts.SyntaxKind.Identifier, 'provideRemoteConfig')
  ) {
    changes.push(
      insertImport(source, modulePath, ['provideRemoteConfig', 'getRemoteConfig'] as any, '@angular/fire/remote-config'),
      ...addImportToModule(source, modulePath, `provideRemoteConfig(() => getRemoteConfig())`, null as any),
    );
  }

  if (
    options.features.includes(FEATURES.Storage) &&
    !findNode(source, ts.SyntaxKind.Identifier, 'provideStorage')
  ) {
    changes.push(
      insertImport(source, modulePath, ['provideStorage', 'getStorage'] as any, '@angular/fire/storage'),
      ...addImportToModule(source, modulePath, `provideStorage(() => getStorage())`, null as any),
    );
  }

  const recorder = host.beginUpdate(modulePath);
  applyToUpdateRecorder(recorder, changes);
  host.commitUpdate(recorder);

  return host;
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
