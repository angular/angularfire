import {
  SchematicsException,
  Tree,
  SchematicContext,
  chain,
  mergeWith
} from '@angular-devkit/schematics';
import {
  NodePackageInstallTask,
  RunSchematicTask
} from '@angular-devkit/schematics/tasks';
import { experimental, JsonParseMode, parseJson } from '@angular-devkit/core';
import { listProjects, projectPrompt, projectTypePrompt } from './utils';

import {DeployOptions, NgAddNormalizedOptions} from './ng-add-common';
import {
  setupUniversalDeployment,
  addFirebaseFunctionsDependencies
} from './ng-add-ssr';
import {
  setupStaticDeployment,
  addFirebaseHostingDependencies
} from './ng-add-static';

function getWorkspace(
  host: Tree
): { path: string; workspace: experimental.workspace.WorkspaceSchema } {
  const possibleFiles = ['/angular.json', '/.angular.json'];
  const path = possibleFiles.filter(p => host.exists(p))[0];

  const configBuffer = host.read(path);
  if (configBuffer === null) {
    throw new SchematicsException(`Could not find angular.json`);
  }
  const content = configBuffer.toString();

  let workspace: experimental.workspace.WorkspaceSchema;
  try {
    workspace = (parseJson(
      content,
      JsonParseMode.Loose
    ) as {}) as experimental.workspace.WorkspaceSchema;
  } catch (e) {
    throw new SchematicsException(`Could not parse angular.json: ` + e.message);
  }

  return {
    path,
    workspace
  };
}

const getProject = (options: DeployOptions, host: Tree) => {
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

export const setupProject =
  (host: Tree, options: DeployOptions & { isUniversalProject: boolean, firebaseProject: string }) => {
    const { path: workspacePath, workspace } = getWorkspace(host);

    const {project, projectName} = getProject(options, host);

    const config: NgAddNormalizedOptions = {
      project: projectName,
      firebaseProject: options.firebaseProject
    };

    if (options.isUniversalProject) {
      return setupUniversalDeployment({
        workspace,
        workspacePath,
        options: config,
        tree: host,
        project
      });
    }
    return setupStaticDeployment({
      workspace,
      workspacePath,
      options: config,
      tree: host,
      project
    });
  };

export const ngAddSetupProject = (
  options: DeployOptions & { isUniversalProject: boolean }
) => async (host: Tree) => {
  const projects = await listProjects();
  const { firebaseProject } = await projectPrompt(projects);
  return setupProject(host, {...options, firebaseProject});
};

export const ngAdd = (options: DeployOptions) => (
  host: Tree,
  context: SchematicContext
) => {

  const {project} = getProject(options, host);

  return projectTypePrompt(project).then(
    ({ universalProject }: { universalProject: boolean }) => {
      if (universalProject) {
        addFirebaseFunctionsDependencies(host);
      } else {
        addFirebaseHostingDependencies(host);
      }
      const projectOptions: DeployOptions & { isUniversalProject: boolean } = {
        ...options,
        isUniversalProject: universalProject
      };
      context.addTask(new RunSchematicTask('ng-add-setup-project', projectOptions), [
        context.addTask(new NodePackageInstallTask())
      ]);
    }
  );
};
