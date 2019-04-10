import { Tree } from '@angular-devkit/schematics';
interface NgAddOptions {
    firebaseProject: string;
    project?: string;
}
export declare function ngAdd(tree: Tree, options: NgAddOptions): import("@angular-devkit/schematics/src/tree/interface").Tree;
export {};
