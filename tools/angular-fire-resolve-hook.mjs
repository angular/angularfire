/**
 * @fileoverview A Node module resolve hook for the jasmine run.
 *
 * The Node specs import `@angular/fire`, but nothing installs that package into `node_modules`:
 * the library under test is the fresh build in `dist/packages-dist`. Without help, Node's module
 * loader fails every such import with ERR_MODULE_NOT_FOUND. This hook steps in front of the
 * loader and points `@angular/fire` and `@angular/fire/<entry>` at the files the built package's
 * own `exports` map lists. Every other import passes through untouched, including the library's
 * own `firebase/app` import, so the specs and the library share one copy of the Firebase SDK.
 *
 * Loaded by `jasmine-register-angular-fire.mjs`, which is what the `test:node` scripts preload.
 */

import { readFileSync } from 'node:fs';

const packageName = '@angular/fire';

let packageRoot;
let exportsMap;

/**
 * Reads the built package's `exports` map once. Called by the registering file, either directly
 * (`module.registerHooks`) or by Node with the `data` passed to `module.register`.
 * @param {{ packageRoot: string }} data `packageRoot` is the `file:` URL of `dist/packages-dist/`.
 */
export function initialize(data) {
  packageRoot = data.packageRoot;
  exportsMap = JSON.parse(readFileSync(new URL('package.json', packageRoot), 'utf8')).exports;
}

/**
 * Resolves `@angular/fire` and `@angular/fire/<entry>` to the built files and leaves every other
 * specifier to Node. Throws when the built package has no such entry, so a typo in a spec's import
 * fails loudly instead of resolving to nothing.
 * @param {string} specifier The import text, for example `@angular/fire/app`.
 * @param {object} context Node's resolve context, passed through to `nextResolve`.
 * @param {Function} nextResolve Node's own resolver, for every other import.
 * @returns {{ url: string, shortCircuit: boolean }} The resolved file.
 */
export function resolve(specifier, context, nextResolve) {
  if (specifier !== packageName && !specifier.startsWith(`${packageName}/`)) {
    return nextResolve(specifier, context);
  }
  const subpath = specifier === packageName ? '.' : `./${specifier.slice(packageName.length + 1)}`;
  const mapped = exportsMap[subpath];
  const entry = typeof mapped === 'string' ? mapped : mapped?.default;
  if (typeof entry !== 'string') {
    throw new Error(`The built ${packageName} has no "${subpath}" entry in its exports map, so "${specifier}" cannot be resolved for the Node specs.`);
  }
  // No format: Node reads it from the resolved file's extension, .mjs for the library and .json for its package.json.
  return { url: new URL(entry, packageRoot).href, shortCircuit: true };
}
