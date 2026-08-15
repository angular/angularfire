import { logging } from '@angular-devkit/core';
import { HostTree, SchematicContext } from '@angular-devkit/schematics';
import * as typescript from 'typescript';
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

  it('keeps the firebase alignment when the rewrite throws', () => {
    const logger = new logging.Logger('test');
    const warn = spyOn(logger, 'warn');
    const addTask = jasmine.createSpy('addTask');
    const context = { logger, addTask } as unknown as SchematicContext;
    const tree = treeWithFirebase('^11.0.0');
    tree.create('angular.json', JSON.stringify({
      projects: { app: { root: '', sourceRoot: 'src' } },
    }));
    tree.create('src/app/foo.ts', `import { getVertexAI } from '@angular/fire/vertexai';`);
    const throwingCompiler = {
      ScriptTarget: typescript.ScriptTarget,
      createSourceFile: () => { throw new Error('boom'); },
    } as unknown as typeof typescript;

    ngUpdate({ compiler: throwingCompiler })(tree, context);

    // The rewrite failure costs only the rewrite, never the firebase alignment.
    const written = JSON.parse(tree.readText('package.json'));
    expect(written.dependencies.firebase).toBe(firebaseVersionRange);
    expect(addTask).toHaveBeenCalledTimes(1);
    expect(warn.calls.allArgs().map(callArgs => String(callArgs[0])).join('\n'))
      .toContain('Skipped the Vertex AI -> AI Logic source rewrite');
  });

  it('runs the Vertex AI rewrite and the alignment through one ngUpdate call', () => {
    const { context, addTask } = contextWithTaskSpy();
    const tree = treeWithFirebase('^11.0.0');
    tree.create('angular.json', JSON.stringify({
      projects: { app: { root: '', sourceRoot: 'src' } },
    }));
    tree.create('src/app/foo.ts', `import { getVertexAI } from '@angular/fire/vertexai';`);

    ngUpdate({ compiler: typescript })(tree, context);

    expect(tree.readText('src/app/foo.ts')).toBe(`import { getAI } from '@angular/fire/ai';`);
    const written = JSON.parse(tree.readText('package.json'));
    expect(written.dependencies.firebase).toBe(firebaseVersionRange);
    expect(addTask).toHaveBeenCalledTimes(1);
  });

});
