import { SchematicsException, Tree, SchematicContext } from '@angular-devkit/schematics';
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
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { PROJECT_TYPE } from './utils';

// We consider a project to be a universal project if it has a `server` architect
// target. If it does, it knows how to build the application's server.
export const isUniversalApp = (
  project: WorkspaceProject
) => project.architect?.server;

export const hasPrerenderOption = (
  project: WorkspaceProject
) => project.architect?.prerender;

function generateHostingConfig(project: string, dist: string, functionName: string, projectType: PROJECT_TYPE) {
  return {
    target: project,
    public: dist,
    ignore: ['**/.*'],
    headers: [{
      // TODO check the hash style in the angular.json
      source: '*.[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].+(css|js)',
      headers: [{
        key: 'Cache-Control',
        value: 'public,max-age=31536000,immutable'
      }]
    }],
    rewrites: [
      projectType === PROJECT_TYPE.CloudFunctions ? {
        source: '**',
        function: functionName
      } : {
        source: '**',
        run: { serviceId: functionName }
      }
    ]
  };
}

function generateFunctionsConfig(source: string) {
  return {
    source
  };
}

export function generateFirebaseJson(
  tree: Tree,
  path: string,
  project: string,
  dist: string,
  functionsOutput: string,
  functionName: string,
  projectType: PROJECT_TYPE,
) {
  const firebaseJson: FirebaseJSON = tree.exists(path)
    ? safeReadJSON(path, tree)
    : {};

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

  const newConfig = generateHostingConfig(project, dist, functionName, projectType);
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

  if (projectType === PROJECT_TYPE.CloudFunctions) {
    firebaseJson.functions = generateFunctionsConfig(functionsOutput);
  }

  overwriteIfExists(tree, path, stringifyFormatted(firebaseJson));
}

export const setupUniversalDeployment = (config: {
  project: WorkspaceProject;
  options: NgAddNormalizedOptions;
  workspacePath: string;
  workspace: Workspace;
  tree: Tree;
  context: SchematicContext;
  projectType: PROJECT_TYPE;
  nodeVersion: string;
}) => {
  const { tree, workspacePath, workspace, options } = config;
  const project = workspace.projects[options.project];

  if (!project.architect?.build?.options?.outputPath) {
    throw new SchematicsException(
      `Cannot read the output path (architect.build.options.outputPath) of the Angular project "${options.project}" in angular.json`
    );
  }

  if (!project.architect?.server?.options?.outputPath) {
    throw new SchematicsException(
      `Cannot read the output path (architect.server.options.outputPath) of the Angular project "${options.project}" in angular.json`
    );
  }

  const ssrDirectory = config.projectType === PROJECT_TYPE.CloudFunctions ? '/functions' : '/run';
  const staticOutput = project.architect.build.options.outputPath;
  const serverOutput = project.architect.server.options.outputPath;
  const functionsOutput = staticOutput.replace('/browser', ssrDirectory);
  if (functionsOutput !== serverOutput.replace('/server', ssrDirectory)) {
    // TODO prompt cause they're using non-standard directories
    throw new SchematicsException(
      `It looks like the project "${options.project}" in your angular.json is using non-standard output directories, AngularFire doesn't support this yet.`
    );
  }

  // TODO clean this up a bit
  const functionName = config.projectType === PROJECT_TYPE.CloudRun ?
    `ssr-${options.project.replace('_', '-')}` :
    `ssr_${options.project}`;

  console.log({ functionName, staticOutput, serverOutput, functionsOutput });

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
      ssr: config.projectType === PROJECT_TYPE.CloudRun ? 'cloud-run' : true,
      prerender: options.prerender,
      functionName,
      functionsNodeVersion: config.nodeVersion,
    }
  };

  tree.overwrite(workspacePath, JSON.stringify(workspace, null, 2));

  addDependencies(
    tree,
    firebaseFunctionsDependencies,
    config.context
  );

  config.context.addTask(new NodePackageInstallTask());

  generateFirebaseJson(tree, 'firebase.json', options.project, staticOutput, functionsOutput, functionName, config.projectType);
  generateFirebaseRc(
    tree,
    '.firebaserc',
    options.firebaseProject.projectId,
    options.firebaseHostingSite,
    options.project
  );

  return tree;
};
