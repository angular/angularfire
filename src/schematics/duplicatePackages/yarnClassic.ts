/* How to ask yarn 1.x which copies of a package are installed, and how to read its answer. */

import { unreadableLinesProblem } from './shared.js';
import type { InstalledEntry, ManagerQuery } from './types.js';

export const yarnClassicQuery: ManagerQuery = {
  args: packageName => ['list', '--pattern', packageName, '--json', '--depth=Infinity'],
  parse: (stdout, packageName, problems) => {
    const found: InstalledEntry[] = [];
    let unreadable = 0;
    // yarn 1 emits one event per line and puts the dependency tree in a single `tree` event.
    for (const line of stdout.split('\n')) {
      if (!line.trim()) { continue; }
      let event: { type?: string; data?: { trees?: unknown[] } };
      try { event = JSON.parse(line); }
      catch { unreadable++; continue; }
      // `null` parses cleanly and then throws on property reads, discarding every entry found.
      if (typeof event !== 'object' || event === null) { unreadable++; continue; }
      if (event.type !== 'tree') { continue; }
      const walk = (nodes: unknown, path: string[]) => {
        if (!Array.isArray(nodes)) { return; }
        for (const node of nodes) {
          if (typeof node !== 'object' || node === null) { continue; }
          const name = Reflect.get(node, 'name');
          if (typeof name !== 'string') { continue; }
          // Names read `firebase@12.18.0`.
          if (name.startsWith(`${packageName}@`)) {
            found.push({ version: name.slice(packageName.length + 1), dependencyPath: [...path] });
          }
          walk(Reflect.get(node, 'children'), [...path, name]);
        }
      };
      walk(event.data?.trees, []);
    }
    if (unreadable > 0) { problems.push(unreadableLinesProblem(unreadable)); }
    return found;
  },
};
