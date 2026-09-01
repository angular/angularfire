/* Turning a report into text. Nothing here decides whether the result is good or bad. */

import { compareBuild as semverCompareBuild, valid as semverValid } from 'semver';
import { executableFor } from './queries.js';
import { maxPrintedEntries } from './types.js';
import type { InstalledCopyReport, InstalledEntry } from './types.js';

/** Orders versions. Anything semver rejects falls back to a string compare. */
const compareVersions = (left: string, right: string): number => {
  const leftValid = semverValid(left) !== null;
  const rightValid = semverValid(right) !== null;
  // Semver-comparable versions must be grouped ahead of the rest before either comparison runs.
  if (leftValid !== rightValid) { return leftValid ? -1 : 1; }
  if (leftValid) { return semverCompareBuild(left, right); }
  // Compare by code unit because localeCompare ordering depends on runtime locale and ICU data.
  return left < right ? -1 : left > right ? 1 : 0;
};

/** The distinct versions among a set of entries, ordered numerically. */
export const distinctVersions = (entries: InstalledEntry[]): string[] =>
  [...new Set(entries.map(entry => entry.version))].sort(compareVersions);

/**
 * Which entries to print when there are more than `maxPrintedEntries` of them.
 *
 * Keep one entry per distinct version first: cutting the list where it happens to end can leave
 * twenty lines all showing the same version and drop the duplicate the reader came for.
 */
const entriesToPrint = (report: InstalledCopyReport): InstalledEntry[] => {
  if (report.entries.length <= maxPrintedEntries) { return report.entries; }
  const chosen = new Set<InstalledEntry>();
  for (const version of report.versions) {
    if (chosen.size >= maxPrintedEntries) { break; }
    const representative = report.entries.find(entry => entry.version === version);
    if (representative) { chosen.add(representative); }
  }
  for (const entry of report.entries) {
    if (chosen.size >= maxPrintedEntries) { break; }
    chosen.add(entry);
  }
  // Printed in the order the manager reported them, not the order they were chosen in.
  return report.entries.filter(entry => chosen.has(entry));
};

/**
 * Turns a report into printable lines, stating what was found and nothing more. No claim that an
 * install is safe or broken, and no advice: a caller decides what, if anything, to say.
 */
export const formatInstalledCopies = (report: InstalledCopyReport): string[] => {
  const versionCount = report.versions.length;
  /* Don't add a count line when nothing was found. Also, multiple entries aren't necessarily
   * multiple installed copies, so don't phrase them as copies. */
  const lines = report.entries.length === 0 ? [] : [
    `${report.packageName}: ${versionCount} distinct ${versionCount === 1 ? 'version' : 'versions'}, ` +
    `reached by ${report.entries.length} dependent ` +
    `${report.entries.length === 1 ? 'package' : 'packages'}` +
    (report.packageManager ? ` (according to ${executableFor(report.packageManager)})` : ''),
  ];
  const printed = entriesToPrint(report);
  for (const entry of printed) {
    const via = entry.dependencyPath.length ? entry.dependencyPath.join(' > ') : 'the workspace root';
    lines.push(`  ${entry.version} via ${via}`);
  }
  if (printed.length < report.entries.length) {
    // With more distinct versions than lines allowed, some versions get no line of their own.
    const shown = new Set(printed.map(entry => entry.version));
    const unnamed = report.versions.filter(version => !shown.has(version)).length;
    lines.push(
      `  ... and ${report.entries.length - printed.length} more` +
      (unnamed ? `, among them ${unnamed} further ${unnamed === 1 ? 'version' : 'versions'} not listed here` : '')
    );
  }
  for (const problem of report.problems) { lines.push(`  problem: ${problem}`); }
  return lines;
};
