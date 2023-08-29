import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { addDependencies } from '../common';
import { DeployOptions } from '../interfaces';
import { peerDependencies } from '../versions.json';

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
