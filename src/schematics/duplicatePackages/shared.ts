/* The two helpers used by more than one package manager's parser. */

import type { InstalledEntry } from './types.js';

/** Printed whenever a line-oriented parser had to skip input. */
export const unreadableLinesProblem = (count: number): string =>
  `${count} ${count === 1 ? 'line' : 'lines'} of the output could not be read, so copies may be missing`;

/**
 * Walks an npm-shaped `dependencies` tree, which pnpm also emits.
 * Do not add a depth limit: running out of call stack warns the user. A limit truncates silently.
 */
export const walkDependencyTree = (
  node: unknown,
  packageName: string,
  path: string[],
  found: InstalledEntry[],
) => {
  if (typeof node !== 'object' || node === null) { return; }
  const dependencies = Reflect.get(node, 'dependencies');
  if (typeof dependencies !== 'object' || dependencies === null) { return; }
  for (const [name, dependency] of Object.entries(dependencies)) {
    // Keep this skip: `Reflect.get` throws on a non-object, and one throw discards every entry.
    if (typeof dependency !== 'object' || dependency === null) { continue; }
    const version = Reflect.get(dependency, 'version');
    if (name === packageName && typeof version === 'string') {
      found.push({ version, dependencyPath: [...path] });
    }
    walkDependencyTree(dependency, packageName, [...path, name], found);
  }
};
