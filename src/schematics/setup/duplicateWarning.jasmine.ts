/*
 * Specs for the message `ng add` prints about duplicate copies of a package.
 *
 * These assert the words a user actually reads. The reporter underneath has its own specs for
 * what it finds. What is checked here is the promise around it: silence means the tree was queried
 * and is fine, and anything else says which of the two other things happened.
 *
 * Each case pins the MEANING of the sentence, not just a substring inside it.
 *
 * The package manager is never really started. `commandHost.run` is stubbed with output shaped
 * like each manager's own, so these run anywhere.
 */

import { lstatSync, mkdtempSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { commandHost, investigationCommandFor } from '../duplicatePackages/index.js';
import type { SpawnOutcome } from '../duplicatePackages/index.js';
import { warnAboutDuplicateFirebase } from './duplicateWarning.js';
import 'jasmine';

/** Shaped like `npm ls firebase --all --json` in a workspace holding two versions. */
const twoVersions = JSON.stringify({
  name: 'app', version: '1.0.0',
  dependencies: {
    firebase: { version: '12.4.0' },
    '@angular/fire': { version: '20.0.1', dependencies: { firebase: { version: '12.18.0' } } },
  },
});

/**
 * One version, reached by three separate dependents.
 *
 * The distinction matters: a check written against the number of dependents rather than the
 * number of versions passes every spec that uses a single-dependent workspace, then raises a
 * false alarm on a healthy project like this one.
 */
const oneVersionThreeDependents = JSON.stringify({
  name: 'app', version: '1.0.0',
  dependencies: {
    firebase: { version: '12.4.0' },
    '@angular/fire': {
      version: '20.0.1',
      dependencies: {
        firebase: { version: '12.4.0' },
        rxfire: { version: '6.2.0', dependencies: { firebase: { version: '12.4.0' } } },
      },
    },
  },
});

/** Shaped like `pnpm -r ls firebase --depth Infinity --json`, which is a list of projects. */
const pnpmTwoVersions = JSON.stringify([{
  name: 'app',
  dependencies: {
    firebase: { version: '12.4.0' },
    lib: { version: '1.0.0', dependencies: { firebase: { version: '12.18.0' } } },
  },
}]);

describe('the duplicate copy warning', () => {

  let workspaceRoot: string;
  let warnings: string[];
  let debugs: string[];
  let context: { logger: { warn: (message: string) => void; debug: (message: string) => void } };

  const removeDirectory = (target: string) => {
    for (const entry of readdirSync(target)) {
      const entryPath = join(target, entry);
      if (lstatSync(entryPath).isDirectory()) { removeDirectory(entryPath); } else { unlinkSync(entryPath); }
    }
    rmdirSync(target);
  };

  const spawnOutcome = (outcome: Partial<SpawnOutcome> = {}): SpawnOutcome =>
    ({ stdout: '', status: 0, failure: undefined, ...outcome });

  /** Names the manager by writing its lockfile, which is how the code identifies one. */
  const lockfile = (name: string) => writeFileSync(join(workspaceRoot, name), '');

  beforeEach(() => {
    workspaceRoot = mkdtempSync(join(tmpdir(), 'angularfire-warning-'));
    warnings = [];
    debugs = [];
    context = { logger: { warn: m => warnings.push(m), debug: m => debugs.push(m) } };
  });

  afterEach(() => removeDirectory(workspaceRoot));

  describe('when two versions are installed', () => {

    beforeEach(() => {
      lockfile('package-lock.json');
      spyOn(commandHost, 'run').and.returnValue(spawnOutcome({ stdout: twoVersions }));
    });

    it('says that there is more than one version', () => {
      /* The sentence has to carry the finding. Pinning only the version numbers and the chains
       * leaves the surrounding words free to say anything, including the opposite. */
      warnAboutDuplicateFirebase(workspaceRoot, context);
      expect(warnings.length).toBe(1);
      /* Anchored at the start, because `toContain` is satisfied by the negation of the sentence
       * it is checking: "does not have more than one version of firebase installed" contains
       * "more than one version of firebase installed". */
      expect(warnings[0]).toMatch(/^\u26a0\ufe0f Your workspace has more than one version of firebase installed\./);
    });

    it('names the dependency that pulled in each copy', () => {
      warnAboutDuplicateFirebase(workspaceRoot, context);
      expect(warnings[0]).toContain('12.18.0 via @angular/fire');
      expect(warnings[0]).toContain('12.4.0 via the workspace root');
    });

    it('explains why it matters', () => {
      warnAboutDuplicateFirebase(workspaceRoot, context);
      // The whole sentence, because a trailing "but not here" survives a substring.
      expect(warnings[0]).toContain(
        'Two copies of the firebase SDK loaded by one app become two separate module instances, '
        + "and they reject each other's objects at runtime with errors that name your own code "
        + 'rather than the duplication.');
    });

  });

  /* An npm workspace cannot tell a manager-specific command from a hardcoded `npm ls`, because
    * the two are identical there. Only a non-npm workspace can. */
  it('offers the command for the manager in use, not always npm', () => {
    lockfile('pnpm-lock.yaml');
    spyOn(commandHost, 'run').and.returnValue(spawnOutcome({ stdout: pnpmTwoVersions }));
    warnAboutDuplicateFirebase(workspaceRoot, context);
    expect(warnings[0]).toContain('pnpm -r ls firebase');
    expect(warnings[0]).not.toContain('npm ls firebase');
  });

  it('says nothing at all when there is one version and nothing went wrong', () => {
    lockfile('package-lock.json');
    spyOn(commandHost, 'run').and.returnValue(spawnOutcome({ stdout: oneVersionThreeDependents }));
    warnAboutDuplicateFirebase(workspaceRoot, context);
    expect(warnings).toEqual([]);
  });

  /* Three packages depending on the same version is one copy on disk and a healthy project.
   * Counting dependents rather than versions turns it into a false alarm. */
  it('does not mistake several dependents on one version for a duplicate', () => {
    lockfile('package-lock.json');
    spyOn(commandHost, 'run').and.returnValue(spawnOutcome({ stdout: oneVersionThreeDependents }));
    warnAboutDuplicateFirebase(workspaceRoot, context);
    expect(warnings).toEqual([]);
  });

  /* Exit 0 with nothing printed is yarn 2+'s well-formed answer for "nothing depends on this
   * package", so it must not warn. The cost, accepted deliberately: a stale lockfile omitting
   * firebase entirely now passes in silence. The shipping caller runs right after ng add
   * installed firebase, so the lockfile entry it reads is fresh. */
  it('stays silent when the manager cleanly answers that nothing depends on the package', () => {
    lockfile('yarn.lock');
    spyOn(commandHost, 'run').and.returnValue(spawnOutcome({ stdout: '4.5.3\n' }))
      .and.returnValues(spawnOutcome({ stdout: '4.5.3\n' }), spawnOutcome({ stdout: '' }));
    warnAboutDuplicateFirebase(workspaceRoot, context);
    expect(warnings.length).toBe(0);
  });

  it('gives the reason it could not finish, not just that it could not', () => {
    lockfile('package-lock.json');
    spyOn(commandHost, 'run').and.returnValue(
      spawnOutcome({ status: null, failure: 'spawnSync npm ENOENT' }));
    warnAboutDuplicateFirebase(workspaceRoot, context);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('could not run npm');
    expect(warnings[0]).toContain('ENOENT');
  });

  it('does not claim a count when it found nothing', () => {
    lockfile('package-lock.json');
    spyOn(commandHost, 'run').and.returnValue(
      spawnOutcome({ status: null, failure: 'spawnSync npm ENOENT' }));
    warnAboutDuplicateFirebase(workspaceRoot, context);
    expect(warnings[0]).not.toContain('0 distinct');
    expect(warnings[0]).not.toContain('0 dependents');
  });

  /* npm exits non-zero for reasons unrelated to the question while still answering it, such as
   * an unmet peer elsewhere in the tree. A complete single-version answer is a clean result, and
   * warning "could not fully check" above it told a healthy project the check failed. */
  it('stays silent when the answer is complete despite a non-zero exit', () => {
    lockfile('package-lock.json');
    spyOn(commandHost, 'run').and.returnValue(
      spawnOutcome({ stdout: oneVersionThreeDependents, status: 1 }));
    warnAboutDuplicateFirebase(workspaceRoot, context);
    expect(warnings.length).toBe(0);
  });


  it('suggests no command when it could not tell which manager to suggest one for', () => {
    writeFileSync(join(workspaceRoot, 'package.json'), JSON.stringify({ packageManager: 'bun@1.1.30' }));
    warnAboutDuplicateFirebase(workspaceRoot, context);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('declares bun');
    expect(warnings[0]).not.toContain('Run ');
    expect(warnings[0]).not.toContain('no package manager could be identified');
  });

  describe('when two versions are found AND something limited the check', () => {

    /* The shape no fixture produced before, and the one where the message most easily
     * contradicts itself. npm exits non-zero for reasons unrelated to the question while still
     * answering it, so a real duplicate arriving alongside a caveat is ordinary. */
    beforeEach(() => {
      lockfile('package-lock.json');
      spyOn(commandHost, 'run').and.returnValue(spawnOutcome({
        stdout: twoVersions, status: 1,
      }));
    });

    it('still leads with the duplicate, not with the caveat', () => {
      warnAboutDuplicateFirebase(workspaceRoot, context);
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toMatch(/^\u26a0\ufe0f Your workspace has more than one version of firebase installed\./);
      expect(warnings[0]).not.toContain('Could not fully check');
    });

    it('says it once, not once per branch', () => {
      warnAboutDuplicateFirebase(workspaceRoot, context);
      expect(warnings.length).toBe(1);
    });

  });

  it('points at the right package when asked about one other than the default', () => {
    lockfile('package-lock.json');
    spyOn(commandHost, 'run').and.returnValue(spawnOutcome({
      stdout: JSON.stringify({
        name: 'app', version: '1.0.0',
        dependencies: {
          rxfire: { version: '6.2.0' },
          lib: { version: '1.0.0', dependencies: { rxfire: { version: '6.1.0' } } },
        },
      }),
    }));
    warnAboutDuplicateFirebase(workspaceRoot, context, 'rxfire');
    expect(warnings[0]).toContain('more than one version of rxfire installed');
    expect(warnings[0]).toContain('npm ls rxfire --all');
    expect(warnings[0]).not.toContain('firebase');
  });

  it('still offers a command when the check could not finish', () => {
    lockfile('package-lock.json');
    spyOn(commandHost, 'run').and.returnValue(
      spawnOutcome({ status: null, failure: 'spawnSync npm ENOENT' }));
    warnAboutDuplicateFirebase(workspaceRoot, context);
    expect(warnings[0]).toContain('Run npm ls firebase --all');
  });

  it('never lets a failed check take down the command it runs inside', () => {
    lockfile('package-lock.json');
    spyOn(commandHost, 'run').and.throwError('something unexpected');
    expect(() => warnAboutDuplicateFirebase(workspaceRoot, context)).not.toThrow();
    expect(warnings).toEqual([]);
    expect(debugs.join(' ')).toContain('something unexpected');
  });

  describe('the command it suggests', () => {

    it('is the same question the code itself asked', () => {
      expect(investigationCommandFor('npm', 'firebase')).toBe('npm ls firebase --all');
      expect(investigationCommandFor('pnpm', 'firebase')).toBe('pnpm -r ls firebase --depth Infinity');
      expect(investigationCommandFor('yarn', 'firebase')).toBe('yarn why firebase');
      expect(investigationCommandFor('yarn-classic', 'firebase'))
        .toBe('yarn list --pattern firebase --depth=Infinity');
    });

  });

});
