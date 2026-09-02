/*
 * Decides what, if anything, `ng add` prints about duplicate copies of a package.
 *
 * `duplicatePackages/` finds the entries and passes no judgment on them. Choosing between
 * warning loudly, warning that the check fell short, and printing nothing at all happens here
 * instead, in one place.
 */

import { findInstalledCopies, formatInstalledCopies, investigationCommandFor } from '../duplicatePackages/index.js';
import type { InstalledCopyReport } from '../duplicatePackages/index.js';

/**
 * The narrow slice of the Angular CLI's `SchematicContext` that `warnAboutDuplicateFirebase`
 * uses: a function to write a warning, and a function to write a debug line. Helps unit tests.
 */
export interface WarningContext {
  logger: { warn(message: string): void; debug(message: string): void };
}

/* Give user the command to view duplicate installs if their package manager was identified. */
const runItYourself = (report: InstalledCopyReport, packageName: string): string =>
  report.packageManager ? ` Run ${investigationCommandFor(report.packageManager, packageName)}` : '';

/**
 * Give the user a warning if duplicate versions are identified, or if something stopped the check
 * from being thorough. Print nothing when one version is identified and nothing went wrong.
 */
export const warnAboutDuplicateFirebase = (
  workspaceRoot: string,
  context: WarningContext,
  packageName = 'firebase',
): void => {
  // Use try/catch so `ng add @angular/fire` doesn't abort when the duplicate install check fails.
  try {
    const report = findInstalledCopies(packageName, workspaceRoot);

    /* `findings` names the chain of packages leading to copy, e.g. `11.10.0 via @angular/fire`. */
    const findings = formatInstalledCopies(report).join('\n');
    const alsoRun = runItYourself(report, packageName);

    /* One sentence for both warnings. It explains the hazard rather than asserting it happened,
     * so it reads correctly whether two versions were found or the check fell short. */
    const whyItMatters =
      `Two copies of the ${packageName} SDK loaded by one app become two separate module ` +
      'instances, and they reject each other\'s objects at runtime with errors that name ' +
      'your own code rather than the duplication.';

    if (report.versions.length > 1) {
      context.logger.warn(
        `⚠️ Your workspace has more than one version of ${packageName} installed.\n\n` +
        `${findings}\n\n` +
        `${whyItMatters}${alsoRun ? `${alsoRun} for the full tree.` : ''}`
      );
      return;
    }

    if (report.problems.length > 0) {
      context.logger.warn(
        `⚠️ Could not fully check whether ${packageName} is installed more than once.\n\n` +
        `${findings}\n\n` +
        `${whyItMatters}${alsoRun ? `${alsoRun} to check yourself.` : ''}`
      );
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    context.logger.debug(`Could not check for duplicate copies of ${packageName}: ${reason}`);
  }
};
