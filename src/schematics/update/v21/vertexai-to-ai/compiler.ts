// How the TypeScript compiler is obtained at ng-update time. It is an optional peer
// dependency, so resolution may fail, and the caller degrades to skip-with-warning
// instead of crashing the migration.

import { join } from 'path';
import type * as ts from 'typescript';

/**
 * Resolve the workspace's `typescript`, or undefined where that is impossible (no `require` in
 * this runtime, or the package is not reachable).
 */
export const resolveTypescript = (): typeof ts | undefined => {
  if (typeof require !== 'function') {
    return undefined;
  }
  const resolutions: (() => typeof ts)[] = [
    () => require('typescript'),
    // The workspace root (ng update's working directory): under an isolated node_modules layout
    // the workspace's own typescript may not be reachable from the package itself.
    () => require('module').createRequire(join(process.cwd(), 'package.json'))('typescript'),
  ];
  for (const resolution of resolutions) {
    try {
      return resolution();
    } catch {
      // Try the next resolution.
    }
  }
  return undefined;
};
