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

const treeWithFirebase = (firebaseVersion?: string) => {
  const tree = new HostTree();
  tree.create('package.json', JSON.stringify({
    name: 'test-app',
    dependencies: firebaseVersion === undefined ? {} : { firebase: firebaseVersion },
  }, null, 2));
  return tree;
};

describe('migration-v21 ngUpdate', () => {

  it('aligns a stale firebase range and schedules an install', () => {
    const { context, addTask } = contextWithTaskSpy();
    const tree = treeWithFirebase('^11.0.0');
    ngUpdate()(tree, context);
    const written = JSON.parse(tree.readText('package.json'));
    expect(written.dependencies.firebase).toBe(firebaseVersionRange);
    expect(addTask).toHaveBeenCalledTimes(1);
  });

  it('schedules nothing when the workspace is already aligned', () => {
    const { context, addTask } = contextWithTaskSpy();
    const tree = treeWithFirebase(firebaseVersionRange);
    ngUpdate()(tree, context);
    expect(addTask).not.toHaveBeenCalled();
  });

});
