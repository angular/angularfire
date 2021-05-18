import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { listProjects, projectPrompt, getWorkspace, getProject, projectTypePrompt } from './utils';
import { DeployOptions, NgAddNormalizedOptions } from './ng-add-common';
import { addFirebaseFunctionsDependencies, setupUniversalDeployment } from './ng-add-ssr';
import { addFirebaseHostingDependencies, setupStaticDeployment } from './ng-add-static';

export const setupProject =
  (host: Tree, options: DeployOptions & { firebaseProject: string, universalProject: boolean }) => {
    const { path: workspacePath, workspace } = getWorkspace(host);

    const {project, projectName} = getProject(options, host);

    const config: NgAddNormalizedOptions = {
      project: projectName,
      firebaseProject: options.firebaseProject
    };

    if (options.universalProject) {
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
) => async (host: Tree, context: SchematicContext) => {

  // HACK HACK HACK
  // I'm still not able to resolve bluebird.... this is definately some sort
  // of race condition.
  await new Promise<void>(resolve => {
    setInterval(() => {
      try {
        require('bluebird');
        resolve();
      } catch (e) { }
    }, 100);
  });

  const projects = await listProjects();
  const { firebaseProject } = await projectPrompt(projects);
  const { project } = getProject(options, host);
  const { universalProject } = await projectTypePrompt(project);
  if (universalProject) { host = addFirebaseFunctionsDependencies(host, context); }
  return setupProject(host, {...options, firebaseProject, universalProject });
};

export const ngAdd = addFirebaseHostingDependencies;
