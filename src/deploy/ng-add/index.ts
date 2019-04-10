import { Tree } from '@angular-devkit/schematics';
import { from, Observable } from 'rxjs';

import { Project } from '../shared/types';

import { ngAdd } from './ng-add';
import { listProjects, projectPrompt } from '../shared/utils';

interface DeployOptions {
    project: string;
}

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function ngDeploy({project}: DeployOptions): (host: Tree) => Observable<Tree> {
    return (host: Tree): Observable<Tree> => {

        return from<Promise<Tree>>(
            listProjects().then((projects: Project[]) => {
                return projectPrompt(projects).then(({firebaseProject}: any) => {
                    return ngAdd(host, {firebaseProject, project})
                });
            })
        );
    };
}
