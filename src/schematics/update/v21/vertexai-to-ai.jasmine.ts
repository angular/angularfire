import { logging } from '@angular-devkit/core';
import { HostTree, SchematicContext } from '@angular-devkit/schematics';
import * as typescript from 'typescript';
import { applyEdits, rewriteVertexAIToAI } from './vertexai-to-ai/index.js';
import 'jasmine';

const context = { logger: new logging.Logger('test') } as unknown as SchematicContext;

const contextWithLogSpies = () => {
  const logger = new logging.Logger('test');
  const warn = spyOn(logger, 'warn');
  const info = spyOn(logger, 'info');
  const spiedContext = { logger } as unknown as SchematicContext;
  return { context: spiedContext, warn, info };
};

const treeWith = (files: Record<string, string>) => {
  const tree = new HostTree();
  tree.create('angular.json', JSON.stringify({
    projects: { app: { root: '', sourceRoot: 'src' } },
  }));
  Object.entries(files).forEach(([path, content]) => tree.create(path, content));
  return tree;
};

describe('rewriteVertexAIToAI', () => {

  it('rewrites a named import and its usages, keeping getVertexAI calls on the Vertex AI backend', () => {
    const source = [
      `import { provideVertexAI, getVertexAI, VertexAI } from '@angular/fire/vertexai';`,
      `import { inject } from '@angular/core';`,
      ``,
      `export const providers = [provideVertexAI(() => getVertexAI())];`,
      `export class Foo { private ai = inject(VertexAI); }`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    const changed = rewriteVertexAIToAI(tree, context, typescript);

    expect(changed).toBe(true);
    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { provideAI, getAI, VertexAIBackend, AI } from '@angular/fire/ai';`);
    expect(out).toContain('provideAI(() => getAI(undefined, { backend: new VertexAIBackend() }))');
    expect(out).toContain('inject(AI)');
    expect(out).not.toContain('getVertexAI');
    expect(out).not.toContain('provideVertexAI');
    expect(out).not.toContain('@angular/fire/vertexai');
  });

  it('passes a lone app argument through to the rewritten call', () => {
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `import { getApp } from '@angular/fire/app';`,
      `export const vertex = getVertexAI(getApp());`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { getAI, VertexAIBackend } from '@angular/fire/ai';`);
    expect(out).toContain('getAI(getApp(), { backend: new VertexAIBackend() })');
  });

  it('moves a literal location option into the VertexAIBackend constructor', () => {
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `import { getApp } from '@angular/fire/app';`,
      `export const vertex = getVertexAI(getApp(), { location: 'europe-west1' });`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    expect(tree.readText('src/app/foo.ts'))
      .toContain(`getAI(getApp(), { backend: new VertexAIBackend('europe-west1') })`);
  });

  it('replaces an empty options literal with the backend object', () => {
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `import { getApp } from '@angular/fire/app';`,
      `export const vertex = getVertexAI(getApp(), {});`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    expect(tree.readText('src/app/foo.ts'))
      .toContain('getAI(getApp(), { backend: new VertexAIBackend() })');
  });

  it('logs each rewritten getVertexAI call', () => {
    const { context: spiedContext, info } = contextWithLogSpies();
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export const vertex = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    expect(info).toHaveBeenCalledTimes(1);
    expect(info.calls.mostRecent().args[0]).toContain('/src/app/foo.ts:2');
    expect(info.calls.mostRecent().args[0]).toContain('Vertex AI backend');
  });

  it('leaves a getVertexAI call with non-literal options in place and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import { provideVertexAI, getVertexAI } from '@angular/fire/vertexai';`,
      `declare const options: { location: string };`,
      `export const vertex = getVertexAI(undefined, options);`,
      `export const p = provideVertexAI(() => vertex);`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    const changed = rewriteVertexAIToAI(tree, spiedContext, typescript);

    expect(changed).toBe(true);
    const out = tree.readText('src/app/foo.ts');
    // Other symbols and the module specifier still migrate. getVertexAI is left whole so the
    // stale import fails to compile loudly instead of silently changing backends.
    expect(out).toContain(`import { provideAI, getVertexAI } from '@angular/fire/ai';`);
    expect(out).toContain('getVertexAI(undefined, options)');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.calls.mostRecent().args[0]).toContain('Gemini Developer API');
  });

  it('leaves every getVertexAI edit out of a file where the binding is used as a value', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export const factory = getVertexAI;`,
      `export const vertex = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { getVertexAI } from '@angular/fire/ai';`);
    expect(out).toContain('const factory = getVertexAI;');
    // The direct call would be rewritable alone, but a half-renamed binding cannot compile.
    expect(out).toContain('const vertex = getVertexAI();');
    // One warning for the value use, one for the skipped-but-rewritable call.
    expect(warn).toHaveBeenCalledTimes(2);
    const warnText = warn.calls.allArgs().map(callArgs => String(callArgs[0])).join('\n');
    expect(warnText).toContain('left a rewritable getVertexAI call');
    expect(warnText).toContain('kept together');
  });

  it('repurposes the getVertexAI specifier when getAI is already imported', () => {
    const source = [
      `import { getAI, getVertexAI } from '@angular/fire/vertexai';`,
      `export const genAI = getAI();`,
      `export const vertex = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { getAI, VertexAIBackend } from '@angular/fire/ai';`);
    // The plain getAI call is untouched, and only the getVertexAI call gets the backend pin.
    expect(out).toContain('const genAI = getAI();');
    expect(out).toContain('const vertex = getAI(undefined, { backend: new VertexAIBackend() });');
  });

  it('drops an unused getVertexAI specifier when getAI is already imported', () => {
    const tree = treeWith({
      'src/app/foo.ts': `import { getAI, getVertexAI } from '@angular/fire/vertexai';`,
    });

    rewriteVertexAIToAI(tree, context, typescript);

    expect(tree.readText('src/app/foo.ts')).toBe(`import { getAI } from '@angular/fire/ai';`);
  });

  it('keeps the local name of an aliased getVertexAI import while pinning its calls', () => {
    const source = [
      `import { getVertexAI as gv } from '@angular/fire/vertexai';`,
      `import { getApp } from '@angular/fire/app';`,
      `export const vertex = gv(getApp());`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { getAI as gv, VertexAIBackend } from '@angular/fire/ai';`);
    expect(out).toContain('gv(getApp(), { backend: new VertexAIBackend() })');
  });

  it('leaves a getVertexAI re-export in place and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const tree = treeWith({
      'src/app/foo.ts': `export { getVertexAI } from '@angular/fire/vertexai';`,
    });

    const changed = rewriteVertexAIToAI(tree, spiedContext, typescript);

    expect(changed).toBe(true);
    expect(tree.readText('src/app/foo.ts')).toBe(`export { getVertexAI } from '@angular/fire/ai';`);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.calls.mostRecent().args[0]).toContain('re-export of getVertexAI');
  });

  it('preserves the public export name of an un-aliased re-export with a from clause', () => {
    const tree = treeWith({
      'src/app/foo.ts': `export { VertexAI, VertexAIModule as Legacy } from '@angular/fire/vertexai';`,
    });

    rewriteVertexAIToAI(tree, context, typescript);

    expect(tree.readText('src/app/foo.ts'))
      .toBe(`export { AI as VertexAI, AIModule as Legacy } from '@angular/fire/ai';`);
  });

  it('rewrites direct firebase SDK imports the same way', () => {
    const source = [
      `import { getVertexAI, VertexAIError } from 'firebase/vertexai';`,
      `import { getApp } from 'firebase/app';`,
      `export const vertex = getVertexAI(getApp());`,
      `export const isAIError = (e: unknown) => e instanceof VertexAIError;`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { getAI, VertexAIBackend, AIError } from 'firebase/ai';`);
    expect(out).toContain('getAI(getApp(), { backend: new VertexAIBackend() })');
    expect(out).toContain('instanceof AIError');
  });

  it('renames only the imported name for an aliased import, leaving usages of the alias', () => {
    const source = [
      `import { VertexAI as MyAI } from '@angular/fire/vertexai';`,
      `import { inject } from '@angular/core';`,
      `export class Foo { private ai = inject(MyAI); }`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { AI as MyAI } from '@angular/fire/ai';`);
    expect(out).toContain('inject(MyAI)');
  });

  it('handles the older vertexai-preview entry point', () => {
    const tree = treeWith({
      'src/app/foo.ts': `import { getVertexAI } from '@angular/fire/vertexai-preview';`,
    });

    rewriteVertexAIToAI(tree, context, typescript);

    expect(tree.readText('src/app/foo.ts')).toBe(`import { getAI } from '@angular/fire/ai';`);
  });

  it('rewrites namespace-import member accesses, reaching the backend class through the namespace', () => {
    const source = [
      `import * as vai from '@angular/fire/vertexai';`,
      `export const p = vai.provideVertexAI(() => vai.getVertexAI());`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import * as vai from '@angular/fire/ai';`);
    expect(out).toContain('vai.provideAI(() => vai.getAI(undefined, { backend: new vai.VertexAIBackend() }))');
  });

  it('leaves unchanged symbols alone', () => {
    const tree = treeWith({
      'src/app/foo.ts': `import { getGenerativeModel, getVertexAI } from '@angular/fire/vertexai';`,
    });

    rewriteVertexAIToAI(tree, context, typescript);

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

    rewriteVertexAIToAI(tree, context, typescript);

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

    const changed = rewriteVertexAIToAI(tree, context, typescript);

    expect(changed).toBe(false);
    expect(tree.readText('src/app/foo.ts')).toBe(`import { getAI } from '@angular/fire/ai';`);
  });

  it('does not crash without an angular.json', () => {
    const tree = new HostTree();
    tree.create('src/app/foo.ts', `import { getVertexAI } from '@angular/fire/vertexai';`);

    expect(() => rewriteVertexAIToAI(tree, context, typescript)).not.toThrow();
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

    const changed = rewriteVertexAIToAI(tree, context, typescript);

    expect(changed).toBe(true);
    expect(tree.readText('projects/lib/src/foo.ts')).toBe(`import { getAI } from '@angular/fire/ai';`);
  });

  it('covers a root project with no sourceRoot (older CLI workspaces) without walking node_modules', () => {
    const tree = new HostTree();
    tree.create('angular.json', JSON.stringify({
      projects: { app: { root: '' } },
    }));
    tree.create('source/foo.ts', `import { getVertexAI } from '@angular/fire/vertexai';`);
    tree.create('node_modules/some-dep/index.ts', `import { getVertexAI } from '@angular/fire/vertexai';`);

    const changed = rewriteVertexAIToAI(tree, context, typescript);

    expect(changed).toBe(true);
    expect(tree.readText('source/foo.ts')).toBe(`import { getAI } from '@angular/fire/ai';`);
    expect(tree.readText('node_modules/some-dep/index.ts'))
      .toBe(`import { getVertexAI } from '@angular/fire/vertexai';`);
  });

  it('renames a renamed symbol used in type position', () => {
    const source = [
      `import { VertexAI } from '@angular/fire/vertexai';`,
      `export let x: VertexAI;`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    expect(tree.readText('src/app/foo.ts')).toContain('let x: AI;');
  });

  it('rewrites namespace member access in type position', () => {
    const source = [
      `import * as fire from '@angular/fire/vertexai';`,
      `export function f(): fire.VertexAI { return fire.getVertexAI(); }`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain('fire.AI');
    expect(out).toContain('fire.getAI(undefined, { backend: new fire.VertexAIBackend() })');
    expect(out).not.toContain('getVertexAI');
  });

  it('leaves a shorthand property in place (it hands the function itself around) and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export const registry = { getVertexAI };`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { getVertexAI } from '@angular/fire/ai';`);
    // Anchored on the object literal: the import line also contains `{ getVertexAI }`, so a bare
    // toContain would pass even if the shorthand were wrongly expanded.
    expect(out).toContain('registry = { getVertexAI };');
    expect(out).not.toContain('getVertexAI: getAI');
    expect(warn).toHaveBeenCalled();
  });

  it('preserves the export name for a bare local re-export', () => {
    const source = [
      `import { VertexAI } from '@angular/fire/vertexai';`,
      `export { VertexAI };`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { AI } from '@angular/fire/ai';`);
    expect(out).toContain('export { AI as VertexAI };');
  });

  it('renames the instances token, the instance observable, the model base class, and the error code', () => {
    const tree = treeWith({
      'src/app/foo.ts': `import { VertexAIInstances, vertexAIInstance$, VertexAIModel, VertexAIErrorCode } from '@angular/fire/vertexai';`,
    });

    rewriteVertexAIToAI(tree, context, typescript);

    expect(tree.readText('src/app/foo.ts'))
      .toBe(`import { AIInstances, AIInstance$, AIModel, AIErrorCode } from '@angular/fire/ai';`);
  });

  it('does not rename a get/set accessor named like an imported symbol', () => {
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export class Foo { get getVertexAI() { return 1; } }`,
      `export const used = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain('get getVertexAI()');
    expect(out).toContain('getAI(undefined, { backend: new VertexAIBackend() })');
  });

  it('does not treat a destructuring property key as a usage', () => {
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export function a(obj: any) { const { getVertexAI: local } = obj; return local; }`,
      `export const used = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    // the property key read from obj is not the import, so it is left untouched
    expect(out).toContain('const { getVertexAI: local } = obj;');
    // the direct call is still rewritten
    expect(out).toContain('getAI(undefined, { backend: new VertexAIBackend() })');
  });

  it('leaves a binding initializer that hands the function around, and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export function b({ cb = getVertexAI }: any) { return cb; }`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { getVertexAI } from '@angular/fire/ai';`);
    expect(out).toContain('cb = getVertexAI');
    expect(warn).toHaveBeenCalled();
  });

  it('leaves a file alone when a local declaration shadows getVertexAI, and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export function f(obj: any) { const { getVertexAI } = obj; return getVertexAI(); }`,
      `export const vertex = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    const out = tree.readText('src/app/foo.ts');
    // Name-based matching cannot tell the destructured local from the import, so nothing but the
    // module specifier changes and the import breaks loudly instead of redirecting the local call.
    expect(out).toContain(`import { getVertexAI } from '@angular/fire/ai';`);
    expect(out).toContain('const { getVertexAI } = obj; return getVertexAI();');
    expect(out).toContain('export const vertex = getVertexAI();');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.calls.mostRecent().args[0]).toContain('declares a local named `getVertexAI`');
    expect(warn.calls.mostRecent().args[0]).toContain('import path itself still moves');
  });

  it('skips a renamed symbol whose name is shadowed by a local, and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import { provideVertexAI, VertexAI } from '@angular/fire/vertexai';`,
      `import { inject } from '@angular/core';`,
      `export function f(obj: any) { const { provideVertexAI } = obj; return provideVertexAI(); }`,
      `export class Foo { private ai = inject(VertexAI); }`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    const out = tree.readText('src/app/foo.ts');
    // provideVertexAI is excluded whole (its local shadow makes it ambiguous). VertexAI still migrates.
    expect(out).toContain(`import { provideVertexAI, AI } from '@angular/fire/ai';`);
    expect(out).toContain('return provideVertexAI();');
    expect(out).toContain('inject(AI)');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('skips namespace member rewrites when the namespace name is shadowed, and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import * as vai from '@angular/fire/vertexai';`,
      `export function f(vai: any) { return vai.getVertexAI(); }`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import * as vai from '@angular/fire/ai';`);
    expect(out).toContain('return vai.getVertexAI();');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('adds VertexAIBackend once for two getVertexAI specifiers in one import', () => {
    const source = [
      `import { getVertexAI, getVertexAI as gv2 } from '@angular/fire/vertexai';`,
      `export const a = getVertexAI();`,
      `export const b = gv2();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    const importLine = out.split('\n')[0];
    expect(importLine).toBe(`import { getAI, VertexAIBackend, getAI as gv2 } from '@angular/fire/ai';`);
    expect(out).toContain('const a = getAI(undefined, { backend: new VertexAIBackend() });');
    expect(out).toContain('const b = gv2(undefined, { backend: new VertexAIBackend() });');
  });

  it('adds VertexAIBackend once when two old entry points are imported', () => {
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `import { getVertexAI as fbGet } from 'firebase/vertexai';`,
      `export const a = getVertexAI();`,
      `export const b = fbGet();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { getAI, VertexAIBackend } from '@angular/fire/ai';`);
    expect(out).toContain(`import { getAI as fbGet } from 'firebase/ai';`);
    // One import plus two constructor calls: the backend class is never double-imported.
    expect((out.match(/VertexAIBackend/g) || []).length).toBe(3);
  });

  it('repurposes the specifier when getAI is imported from the new entry point already', () => {
    const source = [
      `import { getAI } from '@angular/fire/ai';`,
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export const a = getAI();`,
      `export const vertex = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { VertexAIBackend } from '@angular/fire/ai';`);
    expect(out).toContain('const a = getAI();');
    expect(out).toContain('const vertex = getAI(undefined, { backend: new VertexAIBackend() });');
  });

  it('leaves getVertexAI unmigrated when getAI is imported from an unrelated module, and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import { getAI } from 'some-other-lib';`,
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export const v = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    const out = tree.readText('src/app/foo.ts');
    // Rewriting the call to getAI would silently bind it to some-other-lib's getAI.
    expect(out).toContain(`import { getAI } from 'some-other-lib';`);
    expect(out).toContain(`import { getVertexAI } from '@angular/fire/ai';`);
    expect(out).toContain('const v = getVertexAI();');
    const warnText = warn.calls.allArgs().map(callArgs => String(callArgs[0])).join('\n');
    expect(warnText).toContain('already bound here from a source other than AI Logic');
    expect(warnText).toContain('fails to compile there');
    // The skipped call's own warning names the real cause, the foreign binding.
    expect(warnText).toContain('binds getAI or VertexAIBackend from another source');
  });

  it('leaves getVertexAI unmigrated when the file declares its own getAI, and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export function getAI(value: unknown) { return value; }`,
      `export const v = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    const out = tree.readText('src/app/foo.ts');
    // Injecting getAI would collide with the local declaration.
    expect(out).toContain(`import { getVertexAI } from '@angular/fire/ai';`);
    expect(out).toContain('const v = getVertexAI();');
    expect(warn).toHaveBeenCalled();
  });

  it('leaves a star re-export of the old module unmigrated, and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const tree = treeWith({
      'src/app/foo.ts': `export * from '@angular/fire/vertexai';`,
    });

    const changed = rewriteVertexAIToAI(tree, spiedContext, typescript);

    // Rewriting the specifier would silently rename every symbol this file re-exports.
    expect(changed).toBe(false);
    expect(tree.readText('src/app/foo.ts')).toBe(`export * from '@angular/fire/vertexai';`);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.calls.mostRecent().args[0]).toContain('re-exported public symbols');
  });

  it('expands a renamed symbol used as an object shorthand value, keeping the property name', () => {
    const source = [
      `import { provideVertexAI } from '@angular/fire/vertexai';`,
      `export const reg = { provideVertexAI };`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    expect(tree.readText('src/app/foo.ts')).toContain('reg = { provideVertexAI: provideAI };');
  });

  it('moves a shorthand location option into the VertexAIBackend constructor', () => {
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `import { getApp } from '@angular/fire/app';`,
      `const location = 'europe-west1';`,
      `export const vertex = getVertexAI(getApp(), { location });`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    expect(tree.readText('src/app/foo.ts'))
      .toContain('getAI(getApp(), { backend: new VertexAIBackend(location) })');
  });

  it('leaves a call whose location option references a rewritten symbol, and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import { getVertexAI, VertexAI } from '@angular/fire/vertexai';`,
      `declare const region: (marker: unknown) => string;`,
      `export const a = getVertexAI(undefined, { location: region(VertexAI) });`,
      `export const tail = 42;`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    const out = tree.readText('src/app/foo.ts');
    // Replacing the options span would overlap the rename inside it, so the call is left whole
    // (with the inner rename still applied) and nothing after the call gets corrupted.
    expect(out).toContain('getVertexAI(undefined, { location: region(AI) })');
    expect(out).toContain('export const tail = 42;');
    expect(warn.calls.mostRecent().args[0]).toContain('options mention other symbols this migration rewrites');
  });

  it('leaves a call whose options nest another getVertexAI call, and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `declare const pick: (value: unknown) => string;`,
      `export const a = getVertexAI(undefined, { location: pick(getVertexAI()) });`,
      `export const tail = 42;`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain('getVertexAI(undefined, { location: pick(getVertexAI()) })');
    expect(out).toContain('export const tail = 42;');
    // One warning for the unsupported outer call, one for the blocked inner call.
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('leaves a namespace call whose options reference the namespace, and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import * as vai from '@angular/fire/vertexai';`,
      `export const a = vai.getVertexAI(undefined, { location: vai.VertexAIModel });`,
      `export const tail = 42;`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain('vai.getVertexAI(undefined, { location: vai.AIModel })');
    expect(out).toContain('export const tail = 42;');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('leaves a removed symbol in place and warns with guidance', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import { getVertexAI, VertexAIOptions } from '@angular/fire/vertexai';`,
      `export let options: VertexAIOptions | undefined;`,
      `export const a = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    const out = tree.readText('src/app/foo.ts');
    // VertexAIOptions has no drop-in successor, so it keeps its name (a loud break) while the
    // rest of the file still migrates.
    expect(out).toContain(`import { getAI, VertexAIBackend, VertexAIOptions } from '@angular/fire/ai';`);
    expect(out).toContain('let options: VertexAIOptions | undefined;');
    expect(out).toContain('getAI(undefined, { backend: new VertexAIBackend() })');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.calls.mostRecent().args[0]).toContain('no longer exists in the new entry point');
  });

  it('reuses an existing VertexAIBackend import instead of adding a second one', () => {
    const source = [
      `import { VertexAIBackend } from '@angular/fire/ai';`,
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export const a = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { VertexAIBackend } from '@angular/fire/ai';`);
    expect(out).toContain(`import { getAI } from '@angular/fire/ai';`);
    expect(out).toContain('getAI(undefined, { backend: new VertexAIBackend() })');
    // The pre-existing import plus one constructor call: no duplicate binding.
    expect((out.match(/VertexAIBackend/g) || []).length).toBe(2);
  });

  it('rewrites a call whose location reads a property that merely shares a rewritten name', () => {
    const source = [
      `import { getVertexAI, provideVertexAI } from '@angular/fire/vertexai';`,
      `import { getApp } from '@angular/fire/app';`,
      `declare const settings: { provideVertexAI: string };`,
      `export const p = provideVertexAI(() => 1);`,
      `export const a = getVertexAI(getApp(), { location: settings.provideVertexAI });`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    const out = tree.readText('src/app/foo.ts');
    // `settings.provideVertexAI` is a property NAME, which pass 2 never edits, so there is no
    // overlap and the call must still rewrite.
    expect(out).toContain('getAI(getApp(), { backend: new VertexAIBackend(settings.provideVertexAI) })');
    expect(out).toContain('provideAI(() => 1)');
  });

  it('rewrites a call whose options contain a property key sharing a rewritten name', () => {
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `import { getApp } from '@angular/fire/app';`,
      `declare const build: (value: unknown) => string;`,
      `export const a = getVertexAI(getApp(), { location: build({ getVertexAI: true }) });`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    expect(tree.readText('src/app/foo.ts'))
      .toContain('getAI(getApp(), { backend: new VertexAIBackend(build({ getVertexAI: true })) })');
  });

  it('rewrites a namespace call whose location reads a non-renamed namespace member', () => {
    const source = [
      `import * as vai from '@angular/fire/vertexai';`,
      `export const a = vai.getVertexAI(undefined, { location: vai.DEFAULT_LOCATION });`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);

    // `vai.DEFAULT_LOCATION` gets no edit (DEFAULT_LOCATION is not renamed), so no overlap.
    expect(tree.readText('src/app/foo.ts'))
      .toContain('vai.getAI(undefined, { backend: new vai.VertexAIBackend(vai.DEFAULT_LOCATION) })');
  });

  it('warns about a removed symbol reached through a namespace import', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const source = [
      `import * as vai from '@angular/fire/vertexai';`,
      `export const options: vai.VertexAIOptions = {};`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    expect(tree.readText('src/app/foo.ts')).toContain('vai.VertexAIOptions');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.calls.mostRecent().args[0]).toContain('no longer exists in the new entry point');
  });

  it('rewrites a statement mixing an aliased vertex import, a dropped one, and getAI', () => {
    const source = [
      `import { getVertexAI as gv, getVertexAI, getAI } from '@angular/fire/vertexai';`,
      `export const c = gv();`,
      `export const keep = getAI;`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    const changed = rewriteVertexAIToAI(tree, context, typescript);

    // The backend insertion after `gv` and the removal of the unused unaliased specifier share
    // a boundary offset. They compose, and must not trip the conflicting-edits backstop.
    expect(changed).toBe(true);
    const out = tree.readText('src/app/foo.ts');
    expect(out).toContain(`import { getAI as gv, VertexAIBackend, getAI } from '@angular/fire/ai';`);
    expect(out).toContain('gv(undefined, { backend: new VertexAIBackend() })');
    expect(out).toContain('const keep = getAI;');
  });

  it('tolerates a null project entry in angular.json', () => {
    const tree = new HostTree();
    tree.create('angular.json', JSON.stringify({
      projects: { app: { root: '', sourceRoot: 'src' }, broken: null },
    }));
    tree.create('src/app/foo.ts', `import { getVertexAI } from '@angular/fire/vertexai';`);

    const changed = rewriteVertexAIToAI(tree, context, typescript);

    expect(changed).toBe(true);
    expect(tree.readText('src/app/foo.ts')).toBe(`import { getAI } from '@angular/fire/ai';`);
  });

  it('handles a file with a very deep expression without overflowing', () => {
    const source = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export const sum = ${new Array(4000).fill('1').join(' + ')};`,
      `export const vertex = getVertexAI();`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    const changed = rewriteVertexAIToAI(tree, context, typescript);

    expect(changed).toBe(true);
    expect(tree.readText('src/app/foo.ts'))
      .toContain('getAI(undefined, { backend: new VertexAIBackend() })');
  });

  it('skips a file with syntax errors instead of editing its broken tree, and warns', () => {
    const { context: spiedContext, warn } = contextWithLogSpies();
    const broken = [
      `import { getVertexAI } from '@angular/fire/vertexai';`,
      `export const v = getVertexAI(`,
      `class {`,
    ].join('\n');
    const tree = treeWith({
      'src/app/broken.ts': broken,
      'src/app/good.ts': `import { getVertexAI } from '@angular/fire/vertexai';`,
    });

    rewriteVertexAIToAI(tree, spiedContext, typescript);

    // The broken file is untouched (error-recovered offsets are unreliable), the good one migrates.
    expect(tree.readText('src/app/broken.ts')).toBe(broken);
    expect(tree.readText('src/app/good.ts')).toBe(`import { getAI } from '@angular/fire/ai';`);
    expect(warn.calls.allArgs().map(callArgs => String(callArgs[0])).join('\n'))
      .toContain('syntax errors');
  });

  it('handles a sourceRoot with a trailing slash', () => {
    const tree = new HostTree();
    tree.create('angular.json', JSON.stringify({
      projects: { app: { root: '', sourceRoot: 'src/' } },
    }));
    tree.create('src/app/foo.ts', `import { getVertexAI } from '@angular/fire/vertexai';`);

    const changed = rewriteVertexAIToAI(tree, context, typescript);

    expect(changed).toBe(true);
    expect(tree.readText('src/app/foo.ts')).toBe(`import { getAI } from '@angular/fire/ai';`);
  });

  describe('applyEdits', () => {

    it('applies disjoint edits back to front', () => {
      expect(applyEdits('abcdef', [
        { start: 1, end: 2, replacement: 'B' },
        { start: 4, end: 5, replacement: 'E' },
      ])).toBe('aBcdEf');
    });

    it('accepts an insertion adjacent to a replacement boundary', () => {
      expect(applyEdits('abcdef', [
        { start: 1, end: 3, replacement: 'X' },
        { start: 3, end: 3, replacement: '+' },
      ])).toBe('aX+def');
    });

    it('applies a removal and an insertion sharing a start offset in composing order', () => {
      expect(applyEdits('ab, drop, cd', [
        { start: 2, end: 2, replacement: '+X' },
        { start: 2, end: 8, replacement: '' },
      ])).toBe('ab+X, cd');
    });

    it('throws on overlapping edits instead of corrupting the text', () => {
      expect(() => applyEdits('abcdef', [
        { start: 1, end: 4, replacement: 'X' },
        { start: 2, end: 3, replacement: 'Y' },
      ])).toThrowError(/conflicting rewrite edits/);
    });

  });

  it('is idempotent when re-run on already-migrated code', () => {
    const source = [
      `import { provideVertexAI, getVertexAI } from '@angular/fire/vertexai';`,
      `export const p = provideVertexAI(() => getVertexAI());`,
    ].join('\n');
    const tree = treeWith({ 'src/app/foo.ts': source });

    rewriteVertexAIToAI(tree, context, typescript);
    const afterFirst = tree.readText('src/app/foo.ts');
    const changedAgain = rewriteVertexAIToAI(tree, context, typescript);

    expect(changedAgain).toBe(false);
    expect(tree.readText('src/app/foo.ts')).toBe(afterFirst);
  });

});
