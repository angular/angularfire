import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { logging, normalize, virtualFs } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { HostTree, SchematicContext } from '@angular-devkit/schematics';
import { minVersion as semverMinVersion } from 'semver';
import {
  alignFirebaseVersion,
  firebase13VersionRange,
  firebaseVersionRange,
  pinInstalledPrereleaseVersion,
  supportedFirebaseRange,
} from './common.js';
import 'jasmine';

const context = { logger: new logging.Logger('test') } as unknown as SchematicContext;

// The version a workspace already declares, written into the test package.json below.
const lowestRequiredVersion = semverMinVersion(firebaseVersionRange);
if (!lowestRequiredVersion) {
  throw new Error(`firebaseVersionRange ${firebaseVersionRange} matches no version`);
}
const alreadySupportedRange = `~${lowestRequiredVersion.version}`;

const treeWithAngularFire = (declaredVersion: string, section = 'dependencies') => {
  const tree = new HostTree();
  tree.create('package.json', JSON.stringify({
    name: 'test-app',
    [section]: {
      '@angular/fire': declaredVersion,
      firebase: firebaseVersionRange,
    },
  }, null, 2));
  return tree;
};

const sectionIn = (tree: HostTree, section: string) =>
  JSON.parse(tree.readText('package.json'))[section];

const dependenciesIn = (tree: HostTree) => sectionIn(tree, 'dependencies');

describe('pinInstalledPrereleaseVersion', () => {

  it('pins a caret prerelease range to the exact installed version', () => {
    const tree = treeWithAngularFire('^21.0.0-rc.0');
    pinInstalledPrereleaseVersion(tree, context, '21.0.0-rc.0');
    expect(dependenciesIn(tree)['@angular/fire']).toBe('21.0.0-rc.0');
  });

  it('pins a tilde prerelease range to the exact installed version', () => {
    const tree = treeWithAngularFire('~21.0.0-rc.0');
    pinInstalledPrereleaseVersion(tree, context, '21.0.0-rc.0');
    expect(dependenciesIn(tree)['@angular/fire']).toBe('21.0.0-rc.0');
  });

  it('leaves other dependencies untouched when pinning', () => {
    const tree = treeWithAngularFire('^21.0.0-rc.0');
    pinInstalledPrereleaseVersion(tree, context, '21.0.0-rc.0');
    expect(dependenciesIn(tree).firebase).toBe(firebaseVersionRange);
  });

  it('leaves a stable caret range untouched', () => {
    const tree = treeWithAngularFire('^21.0.0');
    pinInstalledPrereleaseVersion(tree, context, '21.0.0');
    expect(dependenciesIn(tree)['@angular/fire']).toBe('^21.0.0');
  });

  it('leaves an exact prerelease version untouched', () => {
    const tree = treeWithAngularFire('21.0.0-rc.0');
    pinInstalledPrereleaseVersion(tree, context, '21.0.0-rc.0');
    expect(dependenciesIn(tree)['@angular/fire']).toBe('21.0.0-rc.0');
  });

  it('leaves a hand-authored range expression untouched', () => {
    const tree = treeWithAngularFire('>=21.0.0-rc.0');
    pinInstalledPrereleaseVersion(tree, context, '21.0.0-rc.0');
    expect(dependenciesIn(tree)['@angular/fire']).toBe('>=21.0.0-rc.0');
  });

  it('does not pin when the installed version does not satisfy the declared range', () => {
    const tree = treeWithAngularFire('^21.0.0-rc.0');
    pinInstalledPrereleaseVersion(tree, context, '22.0.0-rc.0');
    expect(dependenciesIn(tree)['@angular/fire']).toBe('^21.0.0-rc.0');
  });

  it('warns and does not pin when the installed version is not valid semver', () => {
    const warnSpy = spyOn(context.logger, 'warn');
    const tree = treeWithAngularFire('^21.0.0-rc.0');
    pinInstalledPrereleaseVersion(tree, context, 'ANGULARFIRE2_VERSION');
    expect(warnSpy).toHaveBeenCalled();
    expect(dependenciesIn(tree)['@angular/fire']).toBe('^21.0.0-rc.0');
  });

  it('does nothing when the @angular/fire entry is not a string', () => {
    const tree = new HostTree();
    tree.create('package.json', JSON.stringify({
      name: 'test-app',
      dependencies: { '@angular/fire': { version: '^21.0.0-rc.0' } },
    }));
    expect(() => pinInstalledPrereleaseVersion(tree, context, '21.0.0-rc.0')).not.toThrow();
    expect(dependenciesIn(tree)['@angular/fire']).toEqual({ version: '^21.0.0-rc.0' });
  });

  it('does nothing when @angular/fire is not a dependency', () => {
    const tree = new HostTree();
    tree.create('package.json', JSON.stringify({ name: 'test-app', dependencies: {} }));
    expect(() => pinInstalledPrereleaseVersion(tree, context, '21.0.0-rc.0')).not.toThrow();
    expect(dependenciesIn(tree)['@angular/fire']).toBeUndefined();
  });

  it('does nothing when package.json is absent', () => {
    const tree = new HostTree();
    expect(() => pinInstalledPrereleaseVersion(tree, context, '21.0.0-rc.0')).not.toThrow();
  });

  it('pins a prerelease range found in devDependencies', () => {
    const tree = treeWithAngularFire('^21.0.0-rc.0', 'devDependencies');
    pinInstalledPrereleaseVersion(tree, context, '21.0.0-rc.0');
    expect(sectionIn(tree, 'devDependencies')['@angular/fire']).toBe('21.0.0-rc.0');
  });

  it('pins the dependencies entry when @angular/fire appears in both sections', () => {
    const tree = new HostTree();
    tree.create('package.json', JSON.stringify({
      name: 'test-app',
      dependencies: { '@angular/fire': '^21.0.0-rc.0' },
      devDependencies: { '@angular/fire': '^21.0.0-rc.0' },
    }, null, 2));
    pinInstalledPrereleaseVersion(tree, context, '21.0.0-rc.0');
    expect(dependenciesIn(tree)['@angular/fire']).toBe('21.0.0-rc.0');
    expect(sectionIn(tree, 'devDependencies')['@angular/fire']).toBe('^21.0.0-rc.0');
  });

});

const treeWithFirebase = (firebaseVersion?: string, section = 'dependencies') => {
  const tree = new HostTree();
  const packageContents: Record<string, unknown> = { name: 'test-app' };
  if (firebaseVersion !== undefined) {
    packageContents[section] = { firebase: firebaseVersion };
  }
  tree.create('package.json', JSON.stringify(packageContents, null, 2));
  return tree;
};

const withInstalledFirebase = (tree: HostTree, version: string) => {
  tree.create('node_modules/firebase/package.json', JSON.stringify({ name: 'firebase', version }));
  return tree;
};

/* Not rmSync, which this repo's @types/node predates, and not rmdirSync's recursive option,
 * which Node 26 removed. */
const removeDirectory = (target: string) => {
  for (const entry of readdirSync(target)) {
    const entryPath = join(target, entry);
    if (lstatSync(entryPath).isDirectory()) { removeDirectory(entryPath); } else { unlinkSync(entryPath); }
  }
  rmdirSync(target);
};

describe('alignFirebaseVersion', () => {

  it('rewrites a previous-major range', () => {
    const tree = treeWithFirebase('^11.0.0');
    expect(alignFirebaseVersion(tree, context)).toBeTrue();
    expect(dependenciesIn(tree).firebase).toBe(firebaseVersionRange);
  });

  it('rewrites a same-major range that still allows versions below the required floor', () => {
    const tree = treeWithFirebase('^12.0.0');
    expect(alignFirebaseVersion(tree, context)).toBeTrue();
    expect(dependenciesIn(tree).firebase).toBe(firebaseVersionRange);
  });

  it('rewrites a wide range that a stale lockfile can hold below the floor', () => {
    const tree = treeWithFirebase('>=11');
    expect(alignFirebaseVersion(tree, context)).toBeTrue();
    expect(dependenciesIn(tree).firebase).toBe(firebaseVersionRange);
  });

  it('leaves a compatible range untouched', () => {
    const tree = treeWithFirebase(alreadySupportedRange);
    expect(alignFirebaseVersion(tree, context)).toBeFalse();
    expect(dependenciesIn(tree).firebase).toBe(alreadySupportedRange);
  });

  it('adds firebase when the workspace has none', () => {
    const tree = treeWithFirebase(undefined);
    expect(alignFirebaseVersion(tree, context)).toBeTrue();
    expect(dependenciesIn(tree).firebase).toBe(firebaseVersionRange);
  });

  it('aligns firebase in devDependencies without duplicating it into dependencies', () => {
    const tree = treeWithFirebase('^11.0.0', 'devDependencies');
    expect(alignFirebaseVersion(tree, context)).toBeTrue();
    expect(sectionIn(tree, 'devDependencies').firebase).toBe(firebaseVersionRange);
    expect(sectionIn(tree, 'dependencies')).toBeUndefined();
  });

  it('warns about a non-semver specifier and leaves it as-is', () => {
    const warnSpy = spyOn(context.logger, 'warn');
    const tree = treeWithFirebase('latest');
    expect(alignFirebaseVersion(tree, context)).toBeFalse();
    expect(dependenciesIn(tree).firebase).toBe('latest');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('warns about a workspace specifier and leaves it as-is', () => {
    const warnSpy = spyOn(context.logger, 'warn');
    const tree = treeWithFirebase('workspace:*');
    expect(alignFirebaseVersion(tree, context)).toBeFalse();
    expect(dependenciesIn(tree).firebase).toBe('workspace:*');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('rewrites stale entries in both sections when firebase appears twice', () => {
    const tree = new HostTree();
    tree.create('package.json', JSON.stringify({
      name: 'test-app',
      dependencies: { firebase: '^11.0.0' },
      devDependencies: { firebase: '~11.9.0' },
    }, null, 2));
    expect(alignFirebaseVersion(tree, context)).toBeTrue();
    expect(dependenciesIn(tree).firebase).toBe(firebaseVersionRange);
    expect(sectionIn(tree, 'devDependencies').firebase).toBe(firebaseVersionRange);
  });

  it('rewrites only the stale section when the other is already compatible', () => {
    const tree = new HostTree();
    tree.create('package.json', JSON.stringify({
      name: 'test-app',
      dependencies: { firebase: alreadySupportedRange },
      devDependencies: { firebase: '^11.0.0' },
    }, null, 2));
    expect(alignFirebaseVersion(tree, context)).toBeTrue();
    expect(dependenciesIn(tree).firebase).toBe(alreadySupportedRange);
    expect(sectionIn(tree, 'devDependencies').firebase).toBe(firebaseVersionRange);
  });

  it('leaves a firebase 13 range untouched', () => {
    for (const declared of ['^13.0.0', '^13.1.0', '~13.1.0', supportedFirebaseRange]) {
      const tree = treeWithFirebase(declared);
      expect(alignFirebaseVersion(tree, context)).withContext(declared).toBeFalse();
      expect(dependenciesIn(tree).firebase).withContext(declared).toBe(declared);
    }
  });

  it('rewrites an out-of-range entry that starts at firebase 13 to the 13 range, not back to 12', () => {
    for (const declared of ['>=13.0.0', '^13.0.0-20260929163754']) {
      const tree = treeWithFirebase(declared);
      expect(alignFirebaseVersion(tree, context)).withContext(declared).toBeTrue();
      expect(dependenciesIn(tree).firebase).withContext(declared).toBe(firebase13VersionRange);
    }
  });

  it('rewrites an out-of-range entry that reaches below firebase 13 to the 12 range when nothing is installed', () => {
    for (const declared of ['*', '>=12.18.0']) {
      const tree = treeWithFirebase(declared);
      expect(alignFirebaseVersion(tree, context)).withContext(declared).toBeTrue();
      expect(dependenciesIn(tree).firebase).withContext(declared).toBe(firebaseVersionRange);
    }
  });

  it('adds the range of the firebase major already installed', () => {
    for (const [installed, expected] of [['13.1.0', firebase13VersionRange], ['12.19.0', firebaseVersionRange]]) {
      const tree = withInstalledFirebase(treeWithFirebase(undefined), installed);
      expect(alignFirebaseVersion(tree, context)).withContext(installed).toBeTrue();
      expect(dependenciesIn(tree).firebase).withContext(installed).toBe(expected);
    }
  });

  it('rewrites an out-of-range entry to the range of the firebase major already installed', () => {
    for (const [installed, expected] of [['13.1.0', firebase13VersionRange], ['12.19.0', firebaseVersionRange]]) {
      const tree = withInstalledFirebase(treeWithFirebase('*'), installed);
      expect(alignFirebaseVersion(tree, context)).withContext(installed).toBeTrue();
      expect(dependenciesIn(tree).firebase).withContext(installed).toBe(expected);
    }
  });

  it('falls back to the declared range when the installed firebase is outside both majors', () => {
    for (const [installed, declared, expected] of [
      ['11.10.0', '^11.0.0', firebaseVersionRange],
      ['13.0.0-20260929163754', '^13.0.0-20260929163754', firebase13VersionRange],
    ]) {
      const tree = withInstalledFirebase(treeWithFirebase(declared), installed);
      expect(alignFirebaseVersion(tree, context)).withContext(installed).toBeTrue();
      expect(dependenciesIn(tree).firebase).withContext(installed).toBe(expected);
    }
  });

  it('ignores an installed copy that the workspace entry excludes', () => {
    for (const [installed, declared, expected] of [
      ['13.1.0', '~12.10.0', firebaseVersionRange],
      ['12.19.0', '>=13.0.0', firebase13VersionRange],
    ]) {
      const tree = withInstalledFirebase(treeWithFirebase(declared), installed);
      expect(alignFirebaseVersion(tree, context)).withContext(declared).toBeTrue();
      expect(dependenciesIn(tree).firebase).withContext(declared).toBe(expected);
    }
  });

  it('finds firebase installed at a monorepo root above the workspace', () => {
    const repository = mkdtempSync(join(tmpdir(), 'angularfire-monorepo-'));
    try {
      const workspace = join(repository, 'apps', 'web');
      mkdirSync(workspace, { recursive: true });
      mkdirSync(join(repository, 'node_modules', 'firebase'), { recursive: true });
      writeFileSync(join(repository, 'node_modules', 'firebase', 'package.json'),
        JSON.stringify({ name: 'firebase', version: '13.1.0', exports: { './package.json': './package.json' } }));
      writeFileSync(join(workspace, 'package.json'), JSON.stringify({ name: 'web' }));
      // The host `ng add` and `ng update` give a schematic: the real filesystem, scoped to the workspace.
      const tree = new HostTree(new virtualFs.ScopedHost(new NodeJsSyncHost(), normalize(workspace)));
      expect(alignFirebaseVersion(tree, context)).toBeTrue();
      expect(dependenciesIn(tree).firebase).toBe(firebase13VersionRange);
    } finally {
      removeDirectory(repository);
    }
  });

  it('ignores an installed firebase manifest it cannot read', () => {
    const tree = treeWithFirebase(undefined);
    tree.create('node_modules/firebase/package.json', 'not json');
    expect(alignFirebaseVersion(tree, context)).toBeTrue();
    expect(dependenciesIn(tree).firebase).toBe(firebaseVersionRange);
  });

  it('mentions the supported range when it rewrites an entry', () => {
    const infoSpy = spyOn(context.logger, 'info');
    alignFirebaseVersion(treeWithFirebase('^11.0.0'), context);
    expect(infoSpy).toHaveBeenCalledWith(jasmine.stringContaining(supportedFirebaseRange));
  });

  it('matches the firebase range the library declares as its peer dependency', () => {
    const libraryManifest = JSON.parse(readFileSync('src/package.json', 'utf8'));
    expect(libraryManifest.peerDependencies.firebase).toBe(supportedFirebaseRange);
  });

  it('builds against the oldest firebase major the peer dependency accepts', () => {
    /* tools/build.ts imports wrapped functions by name from the installed firebase, so building
     * on a newer major can emit an import that the older major does not export. */
    const rootManifest = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(semverMinVersion(rootManifest.dependencies.firebase)?.major)
      .toBe(semverMinVersion(supportedFirebaseRange)?.major);
  });

  it('writes a range for exactly the majors the peer dependency accepts', () => {
    expect(supportedFirebaseRange.split('||').map(range => range.trim()).sort())
      .toEqual([firebaseVersionRange, firebase13VersionRange].sort());
  });

  it('is a no-op when run a second time', () => {
    const tree = treeWithFirebase('^11.0.0');
    expect(alignFirebaseVersion(tree, context)).toBeTrue();
    expect(alignFirebaseVersion(tree, context)).toBeFalse();
    expect(dependenciesIn(tree).firebase).toBe(firebaseVersionRange);
  });

  it('throws when package.json is absent', () => {
    const tree = new HostTree();
    expect(() => alignFirebaseVersion(tree, context)).toThrow();
  });

});
