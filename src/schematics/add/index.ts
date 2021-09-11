import { chain, Rule, SchematicContext, TaskId, Tree } from '@angular-devkit/schematics';
import { DeployOptions } from '../interfaces';
import { addDependencies } from '../common';
import { peerDependencies } from '../versions.json';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';

const addFirebaseHostingDependencies = () => (tree: Tree, context: SchematicContext) => {
  addDependencies(
    tree,
    peerDependencies,
    context
  );
  return tree;
};

let npmInstallTaskId: TaskId;

const npmInstall = () => (tree: Tree, context: SchematicContext) => {
  npmInstallTaskId = context.addTask(new NodePackageInstallTask());
  return tree;
};

const runSetup = (options: DeployOptions) => (tree: Tree, context: SchematicContext) => {
  context.addTask(new RunSchematicTask('ng-add-setup-project', options), [npmInstallTaskId]);
  return tree;
};

export const ngAdd = (options: DeployOptions): Rule => {
  return chain([
    addFirebaseHostingDependencies(),
    npmInstall(),
    runSetup(options),
  ]);
};
