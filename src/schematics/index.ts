import { Tree } from '@angular-devkit/schematics';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project } from './interfaces';
import { ngAdd } from './ng-add';
import { listProjects, projectPrompt } from './utils';

interface DeployOptions {
    project: string;
}

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export const ngDeploy = ({project}: DeployOptions) => (host: Tree) => from(listProjects()).pipe(
    map((projects: Project[]) => projectPrompt(projects)),
    map(({firebaseProject}: any) => ngAdd(host, {firebaseProject, project}))
)