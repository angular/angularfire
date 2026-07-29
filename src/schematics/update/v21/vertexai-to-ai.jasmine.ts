import { logging } from '@angular-devkit/core';
import { HostTree, SchematicContext } from '@angular-devkit/schematics';
import { rewriteVertexAIToAI } from './vertexai-to-ai.js';
import 'jasmine';

const context = { logger: new logging.Logger('test') } as unknown as SchematicContext;

const treeWith = (files: Record<string, string>) => {
  const tree = new HostTree();
  tree.create('angular.json', JSON.stringify({
    projects: { app: { root: '', sourceRoot: 'src' } },
  }));
  Object.entries(files).forEach(([path, content]) => tree.create(path, content));
  return tree;
};

describe('rewriteVertexAIToAI', () => {

  it('rewrites a named import and its usages', () => {
    const source = [
      `import { provideVertexAI, getVertexAI, VertexAI } from '@angular/fire/vertexai';`,
      `import { inject } from '@angular/core';`,
      ``,
      `export const providers = [provideVertexAI(() => getVertexAI())];`,
      `export class Foo { private ai = inject(VertexAI); }`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    const changed = rewriteVertexAIToAI(tree, context);

    expect(changed).toBe(true);
    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`from '@angular/fire/ai'`);
    expect(out).not.toContain('vertexai');
    expect(out).toContain('provideAI(() => getAI())');
    expect(out).toContain('inject(AI)');
    expect(out).not.toContain('VertexAI');
  });

  it('renames only the imported name for an aliased import, leaving usages of the alias', () => {
    const source = [
      `import { VertexAI as MyAI } from '@angular/fire/vertexai';`,
      `import { inject } from '@angular/core';`,
      `export class Foo { private ai = inject(MyAI); }`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { AI as MyAI } from '@angular/fire/ai';`);
    expect(out).toContain('inject(MyAI)');
  });

  it('handles the older vertexai-preview entry point', () => {
    const tree = treeWith({
      'src/app/foo.ts': `import { getVertexAI } from '@angular/fire/vertexai-preview';`,
    });

    rewriteVertexAIToAI(tree, context);

    expect(tree.readText('src/app/foo.ts')).toBe(`import { getAI } from '@angular/fire/ai';`);
  });

  it('rewrites namespace-import member accesses', () => {
    const source = [
      `import * as vai from '@angular/fire/vertexai';`,
      `export const p = vai.provideVertexAI(() => vai.getVertexAI());`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import * as vai from '@angular/fire/ai';`);
    expect(out).toContain('vai.provideAI(() => vai.getAI())');
  });

  it('leaves unchanged symbols alone', () => {
    const tree = treeWith({
      'src/app/foo.ts': `import { getGenerativeModel, getVertexAI } from '@angular/fire/vertexai';`,
    });

    rewriteVertexAIToAI(tree, context);

    expect(tree.readText('src/app/foo.ts'))
      .toBe(`import { getGenerativeModel, getAI } from '@angular/fire/ai';`);
  });

  it('does not touch strings, comments, or unrelated member names (the AST win over regex)', () => {
    const source = [
      `import { VertexAI } from '@angular/fire/vertexai';`,
      `import { inject } from '@angular/core';`,
      `// VertexAI is now AI Logic`,
      `export const label = 'VertexAI docs';`,
      `export class Foo { VertexAI = 1; private ai = inject(VertexAI); }`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context);

    const out = tree.readText('src/app/foo.ts');
    // comment and string keep the old word
    expect(out).toContain('// VertexAI is now AI Logic');
    expect(out).toContain(`'VertexAI docs'`);
    // a class member literally named VertexAI is not the import binding, so it is untouched
    expect(out).toContain('VertexAI = 1;');
    // the real usage and the import are rewritten
    expect(out).toContain(`from '@angular/fire/ai'`);
    expect(out).toContain('inject(AI)');
  });

  it('is a no-op when there is nothing to rewrite', () => {
    const tree = treeWith({
      'src/app/foo.ts': `import { getAI } from '@angular/fire/ai';`,
    });

    const changed = rewriteVertexAIToAI(tree, context);

    expect(changed).toBe(false);
    expect(tree.readText('src/app/foo.ts')).toBe(`import { getAI } from '@angular/fire/ai';`);
  });

  it('does not crash without an angular.json', () => {
    const tree = new HostTree();
    tree.create('src/app/foo.ts', `import { getVertexAI } from '@angular/fire/vertexai';`);

    expect(() => rewriteVertexAIToAI(tree, context)).not.toThrow();
  });

  it('rewrites files in a non-root project (library / multi-project workspace)', () => {
    const tree = new HostTree();
    tree.create('angular.json', JSON.stringify({
      projects: {
        app: { root: '', sourceRoot: 'src' },
        lib: { root: 'projects/lib', sourceRoot: 'projects/lib/src' },
      },
    }));
    tree.create('projects/lib/src/foo.ts', `import { getVertexAI } from '@angular/fire/vertexai';`);

    const changed = rewriteVertexAIToAI(tree, context);

    expect(changed).toBe(true);
    expect(tree.readText('projects/lib/src/foo.ts')).toBe(`import { getAI } from '@angular/fire/ai';`);
  });

  it('renames a renamed symbol used in type position', () => {
    const source = [
      `import { VertexAI } from '@angular/fire/vertexai';`,
      `export let x: VertexAI;`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context);

    expect(tree.readText('src/app/foo.ts')).toContain('let x: AI;');
  });

  it('rewrites namespace member access in type position', () => {
    const source = [
      `import * as fire from '@angular/fire/vertexai';`,
      `export function f(): fire.VertexAI { return fire.getVertexAI(); }`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain('fire.AI');
    expect(out).toContain('fire.getAI()');
    expect(out).not.toContain('VertexAI');
  });

  it('expands a shorthand property instead of changing its key', () => {
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export const registry = { getVertexAI };`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context);

    expect(tree.readText('src/app/foo.ts')).toContain('{ getVertexAI: getAI }');
  });

  it('preserves the export name for a bare local re-export', () => {
    const source = [
      `import { VertexAI } from '@angular/fire/vertexai';`,
      `export { VertexAI };`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { AI } from '@angular/fire/ai';`);
    expect(out).toContain('export { AI as VertexAI };');
  });

  it('renames the instances token and instance observable', () => {
    const tree = treeWith({
      'src/app/foo.ts': `import { VertexAIInstances, vertexAIInstance$ } from '@angular/fire/vertexai';`,
    });

    rewriteVertexAIToAI(tree, context);

    expect(tree.readText('src/app/foo.ts'))
      .toBe(`import { AIInstances, AIInstance$ } from '@angular/fire/ai';`);
  });

  it('does not rename a get/set accessor named like an imported symbol', () => {
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export class Foo { get getVertexAI() { return 1; } }`,
      `export const used = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain('get getVertexAI()');
    expect(out).toContain('getAI()');
  });

  it('does not rename a destructuring property key, but does rename a binding initializer', () => {
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export function a(obj: any) { const { getVertexAI: local } = obj; return local; }`,
      `export function b({ cb = getVertexAI }: any) { return cb; }`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context);

    const out = tree.readText('src/app/foo.ts');
    // the property key read from obj is not the import, so it is left untouched
    expect(out).toContain('const { getVertexAI: local } = obj;');
    // the default initializer IS a genuine use of the import, so it is renamed
    expect(out).toContain('cb = getAI');
  });

  it('is idempotent when re-run on already-migrated code', () => {
    const source = [
      `import { provideVertexAI, getVertexAI } from '@angular/fire/vertexai';`,
      `export const p = provideVertexAI(() => getVertexAI());`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context);
    const afterFirst = tree.readText('src/app/foo.ts');
    const changedAgain = rewriteVertexAIToAI(tree, context);

    expect(changedAgain).toBe(false);
    expect(tree.readText('src/app/foo.ts')).toBe(afterFirst);
  });

});
