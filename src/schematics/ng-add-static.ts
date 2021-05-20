import { SchematicsException, Tree, SchematicContext } from '@angular-devkit/schematics';
import {
  addDependencies,
  DeployOptions,
  generateFirebaseRc,
  NgAddNormalizedOptions,
  overwriteIfExists,
  safeReadJSON,
  stringifyFormatted
} from './ng-add-common';
import { FirebaseJSON, Workspace, WorkspaceProject } from './interfaces';

import { default as defaultDependencies } from './versions.json';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';

function emptyFirebaseJson() {
  return {
    hosting: []
  };
}

function generateHostingConfig(project: string, dist: string) {
  return {
    target: project,
    public: dist,
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

  /* TODO do we want to prompt for override?
  if (
    firebaseJson.hosting &&
    ((Array.isArray(firebaseJson.hosting) &&
      firebaseJson.hosting.find(config => config.target === project)) ||
      (firebaseJson.hosting as FirebaseHostingConfig).target === project)
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
    firebaseJson.hosting = [firebaseJson.hosting, newConfig];
  }

  overwriteIfExists(tree, path, stringifyFormatted(firebaseJson));
}

export const addFirebaseHostingDependencies = (options: DeployOptions) => (tree: Tree, context: SchematicContext) => {
  addDependencies(
    tree,
    defaultDependencies,
    context
  );
  context.addTask(new RunSchematicTask('ng-add-setup-project', options), [
    context.addTask(new NodePackageInstallTask())
  ]);
  return tree;
};

export const setupStaticDeployment = (config: {
  project: WorkspaceProject;
  options: NgAddNormalizedOptions;
  workspacePath: string;
  workspace: Workspace;
  tree: Tree;
  context: SchematicContext;
}) => {
  const { tree, workspacePath, workspace, options } = config;
  const project = workspace.projects[options.project];

  if (!project.architect?.build?.options?.outputPath) {
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
    options.firebaseProject.projectId,
    options.project
  );

  return tree;
};
