import { Tree } from '@angular-devkit/schematics';
import { getWorkspace, WorkspaceProject } from '../schematics-core/utility/config';

export function getProjectPath(
  host: Tree,
  options: { project?: string | undefined; path?: string | undefined }
) {
  const project = getProject(host, options);

  if (project.root.substr(-1) === '/') {
    project.root = project.root.substr(0, project.root.length - 1);
  }

  if (options.path === undefined) {
    const projectDirName =
      project.projectType === 'application' ? 'app' : 'lib';

    return `${project.root ? `/${project.root}` : ''}/src/${projectDirName}`;
  }

  return options.path;
}

export function getProject(host: Tree, options: { project?: string | undefined; path?: string | undefined }): WorkspaceProject {
  const workspace = getWorkspace(host);

  if (!options.project) {
    options.project = Object.keys(workspace.projects)[0];
  }

  return workspace.projects[options.project];
}
