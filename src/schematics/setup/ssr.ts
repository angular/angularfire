import { SchematicsException, Tree, SchematicContext } from '@angular-devkit/schematics';
import {
  addDependencies,
  generateFirebaseRc,
  overwriteIfExists,
  safeReadJSON,
  stringifyFormatted
} from '../common';
import { FirebaseJSON, Workspace, WorkspaceProject, NgAddNormalizedOptions, PROJECT_TYPE } from '../interfaces';
import { firebaseFunctionsDependencies } from '../versions.json';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { shortSiteName } from '../common';

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
        value: 'public,max-age=31536000,immutable',
      }]
    }, {
      source: '/@(ngsw-worker.js|ngsw.json)',
      headers: [{
        key: 'Cache-Control',
        value: 'no-cache',
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

  const newConfig = generateHostingConfig(project, dist, functionName, projectType);
  if (firebaseJson.hosting === undefined) {
    firebaseJson.hosting = [newConfig];
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

  const ssrDirectory = config.projectType === PROJECT_TYPE.CloudFunctions ? 'functions' : 'run';
  const staticOutput = project.architect.build.options.outputPath;
  const functionsOutput = `dist/${options.project}/${ssrDirectory}`;

  // TODO clean this up a bit
  const functionName = config.projectType === PROJECT_TYPE.CloudRun ?
    `ssr-${options.project.replace('_', '-')}` :
    `ssr_${options.project}`;

  project.architect.deploy = {
    builder: '@angular/fire:deploy',
    options: {
      ssr: config.projectType === PROJECT_TYPE.CloudRun ? 'cloud-run' : 'cloud-functions',
      prerender: options.prerender,
      firebaseProject: options.firebaseProject.projectId,
      firebaseHostingSite: shortSiteName(options.firebaseHostingSite),
      functionName,
      functionsNodeVersion: config.nodeVersion,
      region: 'us-central1',
      browserTarget: options.browserTarget,
      ...(options.serverTarget ? {serverTarget: options.serverTarget} : {}),
      ...(options.prerenderTarget ? {prerenderTarget: options.prerenderTarget} : {}),
      outputPath: functionsOutput,
    }
  };

  tree.overwrite(workspacePath, JSON.stringify(workspace, null, 2));

  addDependencies(
    tree,
    Object.entries(firebaseFunctionsDependencies).reduce((acc, [dep, deets]) => {
      deets.dev = true;
      acc[dep] = deets;
      return acc;
    }, {}),
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
