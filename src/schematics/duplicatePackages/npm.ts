/* How to ask npm which copies of a package are installed, and how to read its answer. */

import { walkDependencyTree } from './shared.js';
import type { InstalledEntry, ManagerQuery } from './types.js';

export const npmQuery: ManagerQuery = {
  args: packageName => ['ls', packageName, '--all', '--json'],
  parse: (stdout, packageName) => {
    const found: InstalledEntry[] = [];
    walkDependencyTree(JSON.parse(stdout), packageName, [], found);
    return found;
  },
};
