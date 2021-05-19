import { SchematicsException, Tree, SchematicContext, noop } from '@angular-devkit/schematics';
import {
  addDependencies,
  generateFirebaseRc,
  NgAddNormalizedOptions,
  overwriteIfExists,
  safeReadJSON,
  stringifyFormatted
} from './ng-add-common';
import { FirebaseJSON, Workspace, WorkspaceProject } from './interfaces';
import { firebaseFunctions as firebaseFunctionsDependencies } from './versions.json';
import { dirname, join } from 'path';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

// We consider a project to be a universal project if it has a `server` architect
// target. If it does, it knows how to build the application's server.
export const isUniversalApp = (
  project: WorkspaceProject
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
    ignore: ['**/.*'],
    headers: [{
      source: '*.[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].+(css|js)',
      headers: [{
        key: 'Cache-Control',
        value: 'public,max-age=31536000,immutable'
      }]
    }],
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
    const existingConfigIndex = firebaseJson.hosting.findIndex(config => config.target === newConfig.target);
    if (existingConfigIndex > -1) {
      firebaseJson.hosting.splice(existingConfigIndex, 1, newConfig);
    } else {
      firebaseJson.hosting.push(newConfig);
    }
  } else {
    firebaseJson.hosting = [firebaseJson.hosting, newConfig];
  }

  firebaseJson.functions = generateFunctionsConfig(dist);

  overwriteIfExists(tree, path, stringifyFormatted(firebaseJson));
}

export const addFirebaseFunctionsDependencies = (tree: Tree, context: SchematicContext) => {
  addDependencies(
    tree,
    firebaseFunctionsDependencies,
    context
  );
  context.addTask(new NodePackageInstallTask());
  return tree;
};

export const setupUniversalDeployment = (config: {
  project: WorkspaceProject;
  options: NgAddNormalizedOptions;
  workspacePath: string;
  workspace: Workspace;
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

  // Add firebase libraries to externalDependencies. For older versions of @firebase/firestore grpc native would cause issues when
  // bundled. While, it's using grpc-js now and doesn't have issues, ngcc tends to bundle the esm version of the libraries; which
  // is problematic for SSR (references to Window, etc.) Let's just mark all of them as external so we know the CJS is used.
  const externalDependencies: string[] = project.architect.server.options.externalDependencies || [];
  [
    'firebase',
    '@firebase/app',
    '@firebase/analytics',
    '@firebase/app',
    '@firebase/auth',
    '@firebase/component',
    '@firebase/database',
    '@firebase/firestore',
    '@firebase/functions',
    '@firebase/installations',
    '@firebase/messaging',
    '@firebase/storage',
    '@firebase/performance',
    '@firebase/remote-config',
    '@firebase/util'
  ].forEach(dep => {
    if (!externalDependencies.includes(dep)) { externalDependencies.push(dep); }
  });

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
    options.firebaseProject.projectId,
    options.project
  );

  return tree;
};
