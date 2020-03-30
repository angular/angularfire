import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { experimental } from '@angular-devkit/core';
import {
  generateFirebaseRc,
  overwriteIfExists,
  safeReadJSON,
  stringifyFormatted,
  addDependencies, NgAddNormalizedOptions
} from './ng-add-common';
import { FirebaseJSON, FirebaseHostingConfig } from './interfaces';

import {
  default as defaultDependencies
} from './versions.json';

function emptyFirebaseJson() {
  return {
    hosting: []
  };
}

function generateHostingConfig(project: string, dist: string) {
  return {
    target: project,
    public: dist,
    ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
    rewrites: [
      {
        source: '**',
        destination: '/index.html'
      }
    ]
  };
}

export function generateFirebaseJson(
  tree: Tree,
  path: string,
  project: string,
  dist: string
) {
  const firebaseJson: FirebaseJSON = tree.exists(path)
    ? safeReadJSON(path, tree)
    : emptyFirebaseJson();

  if (
    firebaseJson.hosting &&
    ((Array.isArray(firebaseJson.hosting) &&
      firebaseJson.hosting.find(config => config.target === project)) ||
      (firebaseJson.hosting as FirebaseHostingConfig).target === project)
  ) {
    throw new SchematicsException(
      `Target ${project} already exists in firebase.json`
    );
  }

  const newConfig = generateHostingConfig(project, dist);
  if (firebaseJson.hosting === undefined) {
    firebaseJson.hosting = newConfig;
  } else if (Array.isArray(firebaseJson.hosting)) {
    firebaseJson.hosting.push(newConfig);
  } else {
    firebaseJson.hosting = [firebaseJson.hosting, newConfig];
  }

  overwriteIfExists(tree, path, stringifyFormatted(firebaseJson));
}

export const addFirebaseHostingDependencies = (tree: Tree) => {
  addDependencies(
    tree,
    defaultDependencies
  );
};

export const setupStaticDeployment = (config: {
  project: experimental.workspace.WorkspaceProject;
  options: NgAddNormalizedOptions;
  workspacePath: string;
  workspace: experimental.workspace.WorkspaceSchema;
  tree: Tree;
}) => {
  const { tree, workspacePath, workspace, options } = config;
  const project = workspace.projects[options.project];

  if (
    !project.architect ||
    !project.architect.build ||
    !project.architect.build.options ||
    !project.architect.build.options.outputPath
  ) {
    throw new SchematicsException(
      `Cannot read the output path (architect.build.options.outputPath) of the Angular project "${options.project}" in angular.json`
    );
  }

  const outputPath = project.architect.build.options.outputPath;

  project.architect.deploy = {
    builder: '@angular/fire:deploy',
    options: {}
  };

  tree.overwrite(workspacePath, JSON.stringify(workspace, null, 2));
  generateFirebaseJson(tree, 'firebase.json', options.project, outputPath);
  generateFirebaseRc(
    tree,
    '.firebaserc',
    options.firebaseProject,
    options.project
  );

  return tree;
};
