/* How to ask pnpm which copies of a package are installed, and how to read its answer. */

import { walkDependencyTree } from './shared.js';
import type { InstalledEntry, ManagerQuery } from './types.js';

/**
 * Parses output that may be several JSON documents concatenated rather than one.
 *
 * `pnpm -r ls --json` prints one array per project, separated by a blank line, so the whole
 * output is not valid JSON. Splitting on blank lines and parsing each chunk handles both that
 * and the single-document case every other manager emits.
 */
export const parseJsonDocuments = (stdout: string, problems: string[] = []): unknown[] => {
  let unreadable = 0;
  const trimmed = stdout.trim();
  if (!trimmed) { return []; }
  try { return [JSON.parse(trimmed)]; }
  catch {
    const documents: unknown[] = [];
    for (const chunk of trimmed.split(/\n\s*\n/)) {
      try { documents.push(JSON.parse(chunk)); }
      catch { unreadable++; }
    }
    if (documents.length === 0) { throw new Error('no parseable JSON document in the output'); }
    if (unreadable > 0) {
      const total = unreadable + documents.length;
      problems.push(`the output arrived as ${total} separate blocks of JSON and ${unreadable} ` +
        'of them could not be read, so copies may be missing');
    }
    return documents;
  }
};

export const pnpmQuery: ManagerQuery = {
  /* `-r` includes every workspace member. Without it pnpm reports the root project only, and a
   * duplicate living in a member is missed with exit 0 and no warning. */
  args: packageName => ['-r', 'ls', packageName, '--depth', 'Infinity', '--json'],
  parse: (stdout, packageName, problems) => {
    const found: InstalledEntry[] = [];
    for (const document of parseJsonDocuments(stdout, problems)) {
      for (const project of Array.isArray(document) ? document : [document]) {
        if (typeof project !== 'object' || project === null) { continue; }
        /* `-r` reports one project per workspace member, and the member's name is the only
         * thing that says where a copy lives. Starting the path with it keeps that. */
        const projectName = Reflect.get(project, 'name');
        const member = typeof projectName === 'string' ? [projectName] : [];
        for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
          walkDependencyTree(
            { dependencies: Reflect.get(project, section) }, packageName, member, found);
        }
      }
    }
    return found;
  },
};
