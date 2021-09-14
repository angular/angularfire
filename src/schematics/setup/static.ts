import { SchematicsException, Tree, SchematicContext } from '@angular-devkit/schematics';
import {
  generateFirebaseRc,
  overwriteIfExists,
  safeReadJSON,
  stringifyFormatted
} from '../common';
import { NgAddNormalizedOptions, FirebaseJSON, Workspace, WorkspaceProject } from '../interfaces';
import { shortSiteName } from '../common';

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

  const newConfig = generateHostingConfig(project, dist);
  if (firebaseJson.hosting === undefined) {
    firebaseJson.hosting = newConfig;
  } else if (Array.isArray(firebaseJson.hosting)) {
    const targetIndex = firebaseJson.hosting.findIndex(it => it.target === newConfig.target);
    if (targetIndex > -1) {
      firebaseJson.hosting[targetIndex] = newConfig;
    } else {
      firebaseJson.hosting.push(newConfig);
    }
  } else {
    firebaseJson.hosting = [firebaseJson.hosting, newConfig];
  }

  overwriteIfExists(tree, path, stringifyFormatted(firebaseJson));
}

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
    options: {
      prerender: options.prerender,
      ssr: false,
      browserTarget: options.browserTarget,
      firebaseProject: options.firebaseProject.projectId,
      firebaseHostingSite: shortSiteName(options.firebaseHostingSite),
      ...(options.serverTarget ? {serverTarget: options.serverTarget} : {}),
      ...(options.prerenderTarget ? {prerenderTarget: options.prerenderTarget} : {}),
    }
  };

  tree.overwrite(workspacePath, JSON.stringify(workspace, null, 2));
  generateFirebaseJson(tree, 'firebase.json', options.project, outputPath);
  generateFirebaseRc(
    tree,
    '.firebaserc',
    options.firebaseProject.projectId,
    options.firebaseHostingSite,
    options.project
  );

  return tree;
};
