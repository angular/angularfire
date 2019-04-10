import { Tree } from '@angular-devkit/schematics';
import { Observable } from 'rxjs';
interface DeployOptions {
    project: string;
}
export declare function ngDeploy({ project }: DeployOptions): (host: Tree) => Observable<Tree>;
export {};
