/* Shapes and limits shared by every file in this folder. No behavior lives here. */

import type { PackageManager } from '../workspace.js';

export type { PackageManager } from '../workspace.js';

/** One entry as the package manager reported it. */
export interface InstalledEntry {
  version: string;
  /** The chain of packages leading to this entry, outermost first. */
  dependencyPath: string[];
}

export interface InstalledCopyReport {
  packageName: string;
  /** Undefined when no manager could be identified, in which case nothing was queried. */
  packageManager: PackageManager | undefined;
  /**
   * Every entry the manager reported. Two entries at the same version may be one shared copy or
   * two. This is a count of dependency relationships rather than of physical directories.
   */
  entries: InstalledEntry[];
  /**
   * Distinct versions, ordered numerically. More than one guarantees more than one instance.
   * One version does NOT guarantee a single instance.
   */
  versions: string[];
  /** Anything that limited the answer. An empty `entries` with problems present is not "clean". */
  problems: string[];
}

/**
 * What a project says about its own package manager, read from the two files that can declare it:
 * the `packageManager` field of `package.json` (corepack's) and `cli.packageManager` in
 * `angular.json` (the Angular CLI's). All fields absent means neither file said anything.
 */
export interface DeclaredManager {
  /** Set when the declaration names a package manager this module can query. */
  manager?: PackageManager;
  /** Set when a declaration names yarn without a version. */
  yarnOfUnknownVersion?: boolean;
  /** Set when it names a package manager this module has no query for, such as bun or cnpm. */
  unqueryable?: string;
}

/** What a spawn produced, whether it succeeded, failed or was never able to start. */
export interface SpawnOutcome {
  stdout: string;
  status: number | null;
  /** Set when the command could not be run or was killed, including on timeout. */
  failure: string | undefined;
}

/** How to query one manager, and how to read its answer. */
export interface ManagerQuery {
  args: (packageName: string) => string[];
  /** `problems` is where a parser records anything that limited what it could read. */
  parse: (stdout: string, packageName: string, problems: string[]) => InstalledEntry[];
}

export interface QueryOptions {
  /** Overrides detection, for a workspace whose manager is already known. */
  packageManager?: PackageManager;
  /** Milliseconds allowed for the query. The `yarn --version` probe is limited separately. */
  timeoutMs?: number;
}

export const defaultTimeoutMs = 30_000;

/** Limit on `yarn --version` alone. Generous because corepack downloads yarn on first use. */
export const yarnProbeTimeoutMs = 10_000;

/** Beyond this many entries the printed list stops being readable and becomes a wall. */
export const maxPrintedEntries = 20;
