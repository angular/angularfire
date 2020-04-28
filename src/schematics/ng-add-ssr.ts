import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { experimental } from '@angular-devkit/core';
import { addDependencies, generateFirebaseRc, NgAddNormalizedOptions, overwriteIfExists, safeReadJSON, stringifyFormatted } from './ng-add-common';
import { FirebaseJSON } from './interfaces';

import { default as defaultDependencies, firebaseFunctions as firebaseFunctionsDependencies } from './versions.json';
import { dirname, join } from 'path';

// We consider a project to be a universal project if it has a `server` architect
// target. If it does, it knows how to build the application's server.
export const isUniversalApp = (
  project: experimental.workspace.WorkspaceProject
) => project.architect && project.architect.server;

function emptyFirebaseJson(source: string) {
  return {
    hosting: [],
    functions: {
      source
    }
  };
}

function generateHostingConfig(project: string, dist: string) {
  return {
    target: project,
    public: join(dirname(dist), dist),
    ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
    rewrites: [
      {
        source: '**',
        function: 'ssr'
      }
    ]
  };
}

function generateFunctionsConfig(dist: string) {
  return {
    source: dirname(dist)
  };
}

export function generateFirebaseJson(
  tree: Tree,
  path: string,
  project: string,
  dist: string,
  serverOutput: string
) {
  const firebaseJson: FirebaseJSON = tree.exists(path)
    ? safeReadJSON(path, tree)
    : emptyFirebaseJson(dirname(serverOutput));

  /* TODO do we want to prompt for override?
  if (
    firebaseJson.hosting &&
    ((Array.isArray(firebaseJson.hosting) &&
      firebaseJson.hosting.find(config => config.target === project)) ||
      (<FirebaseHostingConfig>firebaseJson.hosting).target === project)
  ) {
    throw new SchematicsException(
      `Target ${project} already exists in firebase.json`
    );
  }*/

  const newConfig = generateHostingConfig(project, dist);
  if (firebaseJson.hosting === undefined) {
    firebaseJson.hosting = newConfig;
  } else if (Array.isArray(firebaseJson.hosting)) {
    firebaseJson.hosting.push(newConfig);
  } else {
    firebaseJson.hosting = [firebaseJson.hosting!, newConfig];
  }

  firebaseJson.functions = generateFunctionsConfig(dist);

  overwriteIfExists(tree, path, stringifyFormatted(firebaseJson));
}

export const addFirebaseFunctionsDependencies = (tree: Tree) => {
  addDependencies(
    tree,
    {...defaultDependencies, ...firebaseFunctionsDependencies},
  );
};

export const setupUniversalDeployment = (config: {
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

  if (
    !project.architect ||
    !project.architect.server ||
    !project.architect.server.options ||
    !project.architect.server.options.outputPath
  ) {
    throw new SchematicsException(
      `Cannot read the output path (architect.server.options.outputPath) of the Angular project "${options.project}" in angular.json`
    );
  }

  const staticOutput = project.architect.build.options.outputPath;
  const serverOutput = project.architect.server.options.outputPath;

  // Add @firebase/firestore to externalDependencies
  const externalDependencies = project.architect.server.options.externalDependencies || [];
  externalDependencies.push('@firebase/firestore');
  project.architect.server.options.externalDependencies = externalDependencies;

  project.architect.deploy = {
    builder: '@angular/fire:deploy',
    options: {
      ssr: true
    }
  };

  tree.overwrite(workspacePath, JSON.stringify(workspace, null, 2));

  generateFirebaseJson(tree, 'firebase.json', options.project, staticOutput, serverOutput);
  generateFirebaseRc(
    tree,
    '.firebaserc',
    options.firebaseProject,
    options.project
  );

  return tree;
};
