/*
 * What more than one schematic needs to know about a user's workspace as it exists on disk, plus
 * the rules for handling what it finds there.
 *
 * `common.ts` works against the schematic `Tree`, which is the pending state of a change. The
 * readers here go to the real filesystem, which is what a schematic needs when it wants to know
 * what is actually installed rather than what is about to be written.
 *
 * `assertSafeDependencyName` reads nothing. It lives here because it guards values taken from
 * these same files before they reach a process argv, and both callers of it are callers of the
 * readers above.
 */

import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { SchematicsException } from '@angular-devkit/schematics';
import { parse as parseJsonWithComments } from 'jsonc-parser';

/**
 * `yarn` means yarn 2 and later. `yarn-classic` is yarn 1.x, which is still what
 * `npm i -g yarn` installs and which reports dependencies in an unrelated format.
 */
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'yarn-classic';

/**
 * Lockfile names, and the manager each one identifies, in the order they are checked.
 *
 * Both yarns write `yarn.lock`, so it maps to yarn 2+ here and whoever needs to tell the two
 * apart settles that separately.
 */
export const lockfiles: [PackageManager, string][] = [
  ['pnpm', 'pnpm-lock.yaml'],
  ['yarn', 'yarn.lock'],
  ['npm', 'package-lock.json'],
];

/**
 * Reads and parses a JSON file, returning undefined rather than throwing when it cannot be used.
 *
 * A missing, unreadable or malformed file is an ordinary shape for the things this is pointed at
 * (a workspace `package.json`, an `angular.json`), so callers branch on the result instead of
 * wrapping every call.
 */
export const readJson = (path: string): unknown => {
  try {
    /* jsonc, not JSON.parse: Angular tolerates comments in angular.json and this repo already
     * reads it that way (`utils.ts`). Strict parsing silently dropped a commented file's
     * `cli.packageManager` declaration. */
    return parseJsonWithComments(readFileSync(path, 'utf8'));
  } catch { return undefined; }
};

/**
 * Reads a nested string field out of a parsed JSON file, returning '' for any other shape.
 *
 * These files are the user's to write, so every level may be missing or hold a type the schema
 * does not allow, and none of that is worth an exception.
 */
export const stringAt = (source: unknown, ...path: string[]): string => {
  let value: unknown = source;
  for (const key of path) {
    if (typeof value !== 'object' || value === null) { return ''; }
    value = Reflect.get(value, key);
  }
  return typeof value === 'string' ? value : '';
};

/**
 * How far above the starting directory a monorepo root is looked for. Without a limit the walk
 * goes all the way to the filesystem root.
 */
export const maxWorkspaceWalkDepth = 8;

/**
 * Finds the directory that owns the install, by walking up from `startDirectory` until a lockfile
 * or a `packageManager` declaration appears.
 */
export const workspaceRootFor = (startDirectory: string): string => {
  let directory = startDirectory;
  for (let depth = 0; depth <= maxWorkspaceWalkDepth; depth++) {
    /* Lockfiles this cannot query still mark the directory that owns the install. Without them
     * a bun or deno project walks past its own root and the question is answered wherever an
     * unrelated ancestor left a lockfile. */
    const ownershipMarkers = [...lockfiles.map(([, lockfile]) => lockfile),
      'bun.lock', 'bun.lockb', 'deno.lock'];
    const owns = ownershipMarkers.some(marker => existsSync(join(directory, marker)))
      || stringAt(readJson(join(directory, 'package.json')), 'packageManager') !== '';
    if (owns) { return directory; }
    const parent = dirname(directory);
    if (parent === directory) { break; }
    directory = parent;
  }
  return startDirectory;
};

/**
 * Rejects a dependency name that could be read as a shell command or as a package-manager flag.
 * @param name the dependency name to check
 * @param source names where the value came from, so a rejected name tells the user which file
 *   to go and edit.
 */
export const assertSafeDependencyName = (name: string, source: string): string => {
  if (typeof name !== 'string' || name.length === 0 || name.startsWith('-') ||
      /[\s;&|$`(){}<>!\\'"]/.test(name)) {
    throw new SchematicsException(`Invalid dependency name ${JSON.stringify(name)} ${source}.`);
  }
  return name;
};
