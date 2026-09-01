/* How to ask yarn 2+ which copies of a package are installed, and how to read its answer. */

import { unreadableLinesProblem } from './shared.js';
import type { InstalledEntry, ManagerQuery } from './types.js';

/**
 * Extracts a version from a yarn 2+ locator.
 *
 * Locators are `name@protocol:rest`. Only `npm:` puts the bare version last. `patch:`,
 * `workspace:`, `portal:` and `link:` do not, and taking everything after the final colon yields
 * a fragment of a URL. Yarn appends `::version=` for patched entries, which is the version that
 * matters, so that is preferred when present.
 */
export const versionFromYarnLocator = (locator: string, packageName: string): string | undefined => {
  if (!locator.startsWith(`${packageName}@`)) { return undefined; }
  let descriptor = locator.slice(packageName.length + 1);
  const patched = /::version=([^&]+)/.exec(descriptor);
  if (patched) { return patched[1]; }
  /* Yarn virtualizes every package that declares peerDependencies, wrapping the real descriptor
   * as `virtual:<hash>#<descriptor>`. Unwrapping is required. */
  const virtualized = /^virtual:[^#]*#(.*)$/.exec(descriptor);
  if (virtualized) { descriptor = virtualized[1]; }
  if (descriptor.startsWith('npm:')) {
    const rest = descriptor.slice('npm:'.length);
    // An alias reads `npm:<other-name>@<range>`. Don't take the whole tail.
    const aliased = /^(?:@[^/]+\/)?[^@]+@(.+)$/.exec(rest);
    return aliased ? aliased[1] : rest;
  }
  /* `workspace:`, `portal:` and `link:` name a location rather than a version, but the copy is
   * real and is a separate module instance. */
  return descriptor || undefined;
};

/**
 * A dependent's locator with yarn's virtual wrapper taken off.
 * `yarn why` reports a package that declares peer dependencies twice, once by its plain locator
 * and once as `name@virtual:<hash>#<descriptor>`, both naming the same directory on disk.
 */
const plainDependent = (locator: string): string => locator.replace(/@virtual:[^#]*#/, '@');

export const yarnQuery: ManagerQuery = {
  // Deliberately not `-R`. The flat form already reports every dependent at any depth.
  args: packageName => ['why', packageName, '--json'],
  parse: (stdout, packageName, problems) => {
    const found: InstalledEntry[] = [];
    const seen = new Set<string>();
    let unreadable = 0;
    // yarn 2+ emits one JSON object per line, each naming a dependent and what it pulls in.
    for (const line of stdout.split('\n')) {
      if (!line.trim()) { continue; }
      let record: { value?: string; children?: Record<string, unknown> };
      try { record = JSON.parse(line); }
      catch { unreadable++; continue; }
      // `null` parses cleanly and then throws on property reads, discarding every entry found.
      if (typeof record !== 'object' || record === null) { unreadable++; continue; }
      for (const locator of Object.keys(record.children ?? {})) {
        const version = versionFromYarnLocator(locator, packageName);
        if (!version) { continue; }
        const dependencyPath = record.value ? [plainDependent(record.value)] : [];
        /* One dependent is reported on more than one line whenever it declares peer
         * dependencies. Counted twice it becomes "2 dependents" for one copy. */
        const identity = `${version} ${dependencyPath.join(' ')}`;
        if (seen.has(identity)) { continue; }
        seen.add(identity);
        found.push({ version, dependencyPath });
      }
    }
    if (unreadable > 0) { problems.push(unreadableLinesProblem(unreadable)); }
    return found;
  },
};
