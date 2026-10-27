import { logging } from '@angular-devkit/core';
import { HostTree, SchematicContext } from '@angular-devkit/schematics';
import { firebaseVersionRange } from '../../common.js';
import { ngUpdate } from './index.js';
import 'jasmine';

const contextWithTaskSpy = () => {
  const addTask = jasmine.createSpy('addTask');
  const context = {
    logger: new logging.Logger('test'),
    addTask,
  } as unknown as SchematicContext;
  return { context, addTask };
};

const treeWithDependencies = (dependencies: Record<string, string>) => {
  const tree = new HostTree();
  tree.create('package.json', JSON.stringify({ name: 'test-app', dependencies }, null, 2));
  return tree;
};

const dependenciesIn = (tree: HostTree) => JSON.parse(tree.readText('package.json')).dependencies;

describe('migration-v22 ngUpdate', () => {

  it('adds firebase when the workspace never declared it and schedules an install', () => {
    const { context, addTask } = contextWithTaskSpy();
    const tree = treeWithDependencies({ '@angular/fire': '^22.0.0' });
    ngUpdate()(tree, context);
    expect(dependenciesIn(tree).firebase).toBe(firebaseVersionRange);
    expect(addTask).toHaveBeenCalledTimes(1);
  });

  it('aligns a firebase range outside the peer range and schedules an install', () => {
    const { context, addTask } = contextWithTaskSpy();
    const tree = treeWithDependencies({ firebase: '^11.0.0' });
    ngUpdate()(tree, context);
    expect(dependenciesIn(tree).firebase).toBe(firebaseVersionRange);
    expect(addTask).toHaveBeenCalledTimes(1);
  });

  it('schedules nothing when the workspace is already aligned', () => {
    const { context, addTask } = contextWithTaskSpy();
    const tree = treeWithDependencies({ firebase: firebaseVersionRange });
    ngUpdate()(tree, context);
    expect(dependenciesIn(tree).firebase).toBe(firebaseVersionRange);
    expect(addTask).not.toHaveBeenCalled();
  });

  it('is a no-op on the second run', () => {
    const { context, addTask } = contextWithTaskSpy();
    const tree = treeWithDependencies({});
    ngUpdate()(tree, context);
    ngUpdate()(tree, context);
    expect(dependenciesIn(tree).firebase).toBe(firebaseVersionRange);
    expect(addTask).toHaveBeenCalledTimes(1);
  });

});
