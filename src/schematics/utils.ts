import { readFileSync } from 'fs';
import { FirebaseRc, Project, Workspace, WorkspaceProject } from './interfaces';
import { join } from 'path';
import { isUniversalApp } from './ng-add-ssr';
import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { DeployOptions } from './ng-add-common';

export async function listProjects() {
  const firebase = require('firebase-tools');
  await firebase.login();
  return firebase.projects.list();
}

// `fuzzy` passes either the original list of projects or an internal object
// which contains the project as a property.
const isProject = (elem: Project | { original: Project }): elem is Project => {
  return (elem as { original: Project }).original === undefined;
};

const searchProjects = (projects: Project[]) => {
  return (_: any, input: string) => {
    return Promise.resolve(
      require('fuzzy')
        .filter(input, projects, {
          extract(el: Project) {
            return `${el.projectId} ${el.displayName}`;
          }
        })
        .map((result: Project | { original: Project }) => {
          let original: Project;
          if (isProject(result)) {
            original = result;
          } else {
            original = result.original;
          }
          return {
            name: `${original.displayName} (${original.projectId})`,
            title: original.displayName,
            value: original.projectId
          };
        })
    );
  };
};


export function getWorkspace(
  host: Tree
): { path: string; workspace: Workspace } {
  const possibleFiles = ['/angular.json', '/.angular.json'];
  const path = possibleFiles.filter(p => host.exists(p))[0];

  const configBuffer = host.read(path);
  if (configBuffer === null) {
    throw new SchematicsException(`Could not find angular.json`);
  }

  // We can not depend on this library to have be included in older (or newer) Angular versions.
  // Require here, since the schematic will add it to the package.json and install it before
  // continuing.
  const { parse }: typeof import('jsonc-parser') = require('jsonc-parser');

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

export const projectPrompt = (projects: Project[]) => {
  const inquirer = require('inquirer');
  inquirer.registerPrompt(
    'autocomplete',
    require('inquirer-autocomplete-prompt')
  );
  return inquirer.prompt({
    type: 'autocomplete',
    name: 'firebaseProject',
    source: searchProjects(projects),
    message: 'Please select a project:'
  });
};

export const projectTypePrompt = (project: WorkspaceProject): Promise<{ universalProject: boolean }> => {
  if (isUniversalApp(project)) {
    return require('inquirer').prompt({
      type: 'confirm',
      name: 'universalProject',
      message: 'We detected an Angular Universal project. Do you want to deploy as a Firebase Function?'
    });
  }
  return Promise.resolve({ universalProject: false });
};

export function getFirebaseProjectName(
  workspaceRoot: string,
  target: string
): string | undefined {
  const rc: FirebaseRc = JSON.parse(
    readFileSync(join(workspaceRoot, '.firebaserc'), 'UTF-8')
  );
  const targets = rc.targets || {};
  const projects = Object.keys(targets || {});
  return projects.find(
    project => !!Object.keys(targets[project].hosting).find(t => t === target)
  );
}
