import { readFileSync } from 'fs';
import { FirebaseRc, Workspace, WorkspaceProject, FirebaseApp, FirebaseHostingSite, DeployOptions } from './interfaces';
import { join } from 'path';
import { SchematicsException, Tree } from '@angular-devkit/schematics';

// We consider a project to be a universal project if it has a `server` architect
// target. If it does, it knows how to build the application's server.
export const isUniversalApp = (
  project: WorkspaceProject
) => project.architect?.server;

export const hasPrerenderOption = (
  project: WorkspaceProject
) => project.architect?.prerender;

export const shortAppId = (app?: FirebaseApp) => app?.appId && app.appId.split('/').pop();

export const shortSiteName = (site?: FirebaseHostingSite) => site?.name && site.name.split('/').pop();

export function getWorkspace(
  host: Tree
): { path: string; workspace: Workspace } {
  const possibleFiles = ['/angular.json', '/.angular.json'];
  const path = possibleFiles.filter(p => host.exists(p))[0];

  const configBuffer = host.read(path);
  if (configBuffer === null) {
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
