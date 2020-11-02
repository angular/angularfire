import { experimental } from '@angular-devkit/core';
import { readFileSync } from 'fs';
import { FirebaseRc, Project } from './interfaces';
import { join } from 'path';
import { isUniversalApp } from './ng-add-ssr';

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

export const projectTypePrompt = (project: experimental.workspace.WorkspaceProject) => {
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
