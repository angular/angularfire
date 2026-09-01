/* The four managers in one table. Adding a fifth means a `PackageManager` member and a row here. */

import { npmQuery } from './npm.js';
import { pnpmQuery } from './pnpm.js';
import type { InstalledEntry, ManagerQuery, PackageManager } from './types.js';
import { yarnQuery } from './yarn.js';
import { yarnClassicQuery } from './yarnClassic.js';

export const queries: Record<PackageManager, ManagerQuery> = {
  npm: npmQuery,
  pnpm: pnpmQuery,
  yarn: yarnQuery,
  'yarn-classic': yarnClassicQuery,
};

/** The executable to run for each manager. Both yarns are invoked as `yarn`. */
export const executableFor = (packageManager: PackageManager): string =>
  packageManager === 'yarn-classic' ? 'yarn' : packageManager;

/** The arguments used to query one manager. */
export const queryArgsFor = (packageManager: PackageManager, packageName: string): string[] =>
  queries[packageManager].args(packageName);

/** The command to show installed package versions, written so a user can run it themselves. */
export const investigationCommandFor = (packageManager: PackageManager, packageName: string): string =>
  [
    executableFor(packageManager),
    ...queryArgsFor(packageManager, packageName).filter(argument => argument !== '--json'),
  ].join(' ');

/** Reads one manager's output without running it. */
export const parseInstalledEntries = (
  packageManager: PackageManager,
  stdout: string,
  packageName: string,
  problems: string[] = [],
): InstalledEntry[] => queries[packageManager].parse(stdout, packageName, problems);
