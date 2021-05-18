import { chain, Tree } from '@angular-devkit/schematics';
import { listProjects, projectPrompt, getWorkspace, getProject } from './utils';
import { DeployOptions, NgAddNormalizedOptions } from './ng-add-common';
import { addFirebaseFunctionsDependencies, setupUniversalDeployment } from './ng-add-ssr';
import { addFirebaseHostingDependencies, setupStaticDeployment } from './ng-add-static';

export const setupProject =
  (host: Tree, options: DeployOptions & { firebaseProject: string, isUniversalProject: boolean }) => {
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
    } else {
      return setupStaticDeployment({
        workspace,
        workspacePath,
        options: config,
        tree: host,
        project
      });
    }
};

export const ngAddSetupProject = (
  options: DeployOptions
) => async (host: Tree) => {
  const projects = await listProjects();
  const { firebaseProject } = await projectPrompt(projects);
  const isUniversalProject = (global as any).setupAsAngularUniversalApp;
  return setupProject(host, {...options, firebaseProject, isUniversalProject });
};

export const ngAdd = (options: DeployOptions) => chain([
  addFirebaseHostingDependencies(),
  addFirebaseFunctionsDependencies(options),
  ngAddSetupProject(options),
]);
