import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { DeployOptions } from '../interfaces';
import { addDependencies } from '../common';
import { peerDependencies } from '../versions.json';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';

export const ngAdd = (options: DeployOptions) => (tree: Tree, context: SchematicContext) => {
  addDependencies(
    tree,
    peerDependencies,
    context
  );
  const npmInstallTaskId = context.addTask(new NodePackageInstallTask());
  context.addTask(new RunSchematicTask('ng-add-setup-project', options), [npmInstallTaskId]);
  return tree;
};
