/*
 * Asks the workspace's own package manager what it installed for a package, and reports every
 * entry it named plus the distinct versions among them.
 *
 * "Entry" rather than "copy", because a manager lists each place the package was reached from, and
 * two entries at the same version may be one directory on disk or two. A package installed at two
 * versions is two module instances, and they reject each other's objects at runtime with errors
 * naming the caller's code rather than the duplication.
 *
 * This file owns identifying which manager the workspace uses and running it. Reading its output
 * lives in one file per manager beside this one; turning a result into text lives in `format.ts`.
 *
 * Nothing here renders a verdict. It reports what each manager said. A caller that wants to warn
 * writes that rule itself, where it can be read.
 *
 * Known limit: in a monorepo the question is answered for the whole workspace while `ng add` was
 * pointed at one project inside it, so a project resolving exactly one version can be warned about
 * a sibling's. Scoping it is per-manager work and neither yarn scopes by directory at all.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import crossSpawn from 'cross-spawn';
import { assertSafeDependencyName, lockfiles, readJson, stringAt, workspaceRootFor } from '../workspace.js';
import { distinctVersions } from './format.js';
import { executableFor, queries } from './queries.js';
import { defaultTimeoutMs, yarnProbeTimeoutMs } from './types.js';
import type { DeclaredManager, InstalledCopyReport, InstalledEntry, PackageManager, QueryOptions, SpawnOutcome } from './types.js';

export type { InstalledCopyReport, InstalledEntry, PackageManager, QueryOptions, SpawnOutcome } from './types.js';
export { distinctVersions, formatInstalledCopies } from './format.js';
export { investigationCommandFor, parseInstalledEntries, queryArgsFor } from './queries.js';

/**
 * Decides from `yarn --version` report whether this is yarn 1.x or yarn 2+. Anything unrecognized
 * falls back to yarn 2+, whose parser rejects unfamiliar input rather than mis-reading it.
 */
export const yarnFromVersion = (reportedVersion: string): PackageManager => {
  /* Handles both `yarn --version` output (always a full version) and a declared specifier, which
   * may be `1`, `^1.22.22` or `1.x`. Only the leading major matters, and "10" must not match. */
  const major = /^[^\d]*(\d+)/.exec(reportedVersion.trim())?.[1];
  return major === '1' ? 'yarn-classic' : 'yarn';
};

/**
 * Reads what a project declares about its package manager. The caller only falls back to looking
 * for lockfiles when this finds nothing. A declaration is more certain than looking for lockfiles.
 *
 * Directories must be passed nearest first. An Angular workspace nested inside a monorepo often
 * states its manager in its own `angular.json` while the monorepo root never mentions one, so
 * reading only the monorepo root would throw away the more specific statement.
 */
const declaredManager = (directories: string[]): DeclaredManager => {
  const declarations: string[] = [];
  for (const directory of directories) {
    declarations.push(stringAt(readJson(join(directory, 'package.json')), 'packageManager'));
    declarations.push(stringAt(readJson(join(directory, 'angular.json')), 'cli', 'packageManager'));
  }
  for (const declaration of declarations) {
    // corepack spells it `name@version`, angular.json spells it `name`.
    const name = declaration.split('@')[0];
    if (!name) { continue; }
    if (name === 'npm' || name === 'pnpm') { return { manager: name }; }
    if (name === 'yarn') {
      const version = declaration.includes('@') ? declaration.split('@')[1] : '';
      return version ? { manager: yarnFromVersion(version) } : { yarnOfUnknownVersion: true };
    }
    // `cli.packageManager` also accepts bun and cnpm, which this module has no query for.
    return { unqueryable: name };
  }
  return {};
};

/** Every spawn this module makes funnels through this one runner. Exported as object for specs. */
export const commandHost = {
  /** Runs a command without a shell and returns its output, whether or not it exited cleanly. */
  run(command: string, args: string[], cwd: string, timeoutMs: number): SpawnOutcome {
    const result = crossSpawn.sync(command, args, {
      cwd,
      encoding: 'utf8',
      // Raised to at least 1: Node reads `timeout: 0` as no timeout at all.
      timeout: Math.max(1, timeoutMs),
      // The default 1 MiB truncates a large monorepo's listing into an ENOBUFS failure.
      maxBuffer: 64 * 1024 * 1024,
      // This runs unattended inside `ng add`, where a console window would be a surprise.
      windowsHide: true,
    });
    return {
      stdout: result.stdout ?? '',
      status: result.status,
      failure: result.error?.message,
    };
  },
};

/** Checks the workspace's declaration first, then its lockfile, and for yarn a version probe. */
export const detectPackageManager = (
  workspaceRoot: string,
  problems: string[] = [],
): PackageManager | undefined =>
  detectFrom(workspaceRoot, workspaceRootFor(workspaceRoot), problems);

/** Detection for a caller that already found the workspace root. */
const detectFrom = (
  startDirectory: string,
  root: string,
  problems: string[],
): PackageManager | undefined => {
  /* Declarations are read from the caller's own directory as well as `root`, because a nested
   * Angular workspace can name a manager its monorepo root does not. The query itself always
   * runs in `root`, where the lockfile and node_modules live. */
  const declared = declaredManager(root === startDirectory ? [root] : [startDirectory, root]);
  if (declared.manager) { return declared.manager; }
  if (declared.unqueryable) {
    problems.push(
      `the workspace declares ${declared.unqueryable}, and this check was not designed to ` +
      `handle ${declared.unqueryable}`
    );
    return undefined;
  }
  // A declaration of plain `yarn` names the manager already, leaving only its version to find.
  const detected = declared.yarnOfUnknownVersion
    ? 'yarn'
    : lockfiles.find(([, lockfile]) => existsSync(join(root, lockfile)))?.[0];
  if (detected !== 'yarn') { return detected; }

  /* The lockfile names its own generation: yarn 1 writes "# yarn lockfile v1" in its header,
   * yarn 2+ writes an "__metadata:" block. Reading it beats probing the yarn on PATH, which can
   * be a different generation than the one that wrote this project. */
  try {
    const lockfileHead = readFileSync(join(root, 'yarn.lock'), 'utf8').slice(0, 500);
    if (lockfileHead.includes('yarn lockfile v1')) { return 'yarn-classic'; }
    if (lockfileHead.includes('__metadata:')) { return 'yarn'; }
  } catch { /* No readable lockfile, e.g. a bare `yarn` declaration before install: probe. */ }

  const assumedYarn2Problem =
    'so yarn 2+ was assumed. If this project uses yarn 1.x, nothing would have been found';
  const probe = commandHost.run('yarn', ['--version'], root, yarnProbeTimeoutMs);
  const reported = probe.stdout.trim();
  // Every yarn version contains a digit. Anything else is unreadable however the process exited.
  if (!/\d/.test(reported)) {
    const cause = probe.failure ?? (probe.status === 0 ? 'it printed no version' : `exit status ${probe.status}`);
    problems.push(`could not determine the yarn version (${cause}), ${assumedYarn2Problem}`);
    return 'yarn';
  }
  const whichYarn = yarnFromVersion(reported);
  if (probe.failure || probe.status !== 0) {
    // Name the yarn actually chosen. A blanket "yarn 2+ was assumed" could contradict it.
    problems.push(
      `yarn printed version ${reported} but exited with ` +
      `${probe.failure ?? `status ${probe.status}`}, so ${whichYarn} was used`
    );
  }
  return whichYarn;
};

/**
 * Asks the workspace's package manager where `packageName` is installed and at which versions.
 * @param packageName the package to ask about, for example `'firebase'` or `'rxfire'`
 * @param workspaceRoot the directory holding the lockfile and `node_modules`
 */
export const findInstalledCopies = (
  packageName: string,
  workspaceRoot: string,
  options: QueryOptions = {},
): InstalledCopyReport => {
  const problems: string[] = [];
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
  assertSafeDependencyName(packageName, 'as the package to report installed copies of');

  const root = workspaceRootFor(workspaceRoot);
  /* Both directories: a nested Angular workspace can name a package manager its monorepo root
   * does not. `root` is passed in because it has already been found. */
  const packageManager = options.packageManager
    ?? detectFrom(workspaceRoot, root, problems);
  if (!packageManager) {
    if (problems.length === 0) {
      problems.push('no package manager could be identified, so nothing was queried');
    }
    return { packageName, packageManager: undefined, entries: [], versions: [], problems };
  }

  // run the package manager command to check for duplicate installs
  const query = queries[packageManager];
  const outcome = commandHost.run(
    executableFor(packageManager), query.args(packageName), root, timeoutMs);

  if (outcome.failure) {
    // A kill on timeout arrives here as an error, not a status.
    const timedOut = outcome.failure.includes('ETIMEDOUT');
    problems.push(timedOut
      ? `${executableFor(packageManager)} took longer than the ${timeoutMs / 1000} second timeout`
      : `could not run ${executableFor(packageManager)} (${outcome.failure})`);
    return { packageName, packageManager, entries: [], versions: [], problems };
  }

  // The name the user can type. `yarn-classic` is this module's word, not a program.
  const executable = executableFor(packageManager);
  let entries: InstalledEntry[];
  try {
    // Parse even on a non-zero exit: these commands report unrelated problems and still answer.
    entries = query.parse(outcome.stdout, packageName, problems);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    problems.push(`${executable} output could not be parsed (${reason})`);
    if (outcome.status !== 0) { problems.push(`${executable} exited with status ${outcome.status}`); }
    return { packageName, packageManager, entries: [], versions: [], problems };
  }

  // Finding nothing is not the same as there being nothing, and silence would imply the latter.
  if (entries.length === 0) {
    /* The exit status is only reported when it corroborates an empty answer. These commands exit
     * non-zero for reasons unrelated to the question, such as an unmet peer elsewhere, and a
     * complete answer next to "exited with status 1" reads as a failed check. */
    if (outcome.status !== 0) {
      problems.push(`${executable} exited with status ${outcome.status}`);
    }
    if (outcome.stdout.trim().length > 0) {
      problems.push(
        `${packageName} was not mentioned in ${executable}'s output, so either it is not ` +
        'installed or the output is in a shape this cannot read');
    } else if (outcome.status !== 0) {
      problems.push(
        `${executable} exited without printing anything, so nothing could be read about ` +
        `${packageName}`);
    }
    /* Exit 0 with nothing printed is yarn 2+'s well-formed answer for "nothing depends on this
     * package". No copies means no duplicate, so nothing is recorded and the caller stays silent. */
  }

  return { packageName, packageManager, entries, versions: distinctVersions(entries), problems };
};
