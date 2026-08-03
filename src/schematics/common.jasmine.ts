import { readFileSync } from 'fs';
import { logging } from '@angular-devkit/core';
import { HostTree, SchematicContext } from '@angular-devkit/schematics';
import { alignFirebaseVersion, firebaseVersionRange, pinInstalledPrereleaseVersion } from './common.js';
import 'jasmine';

const context = { logger: new logging.Logger('test') } as unknown as SchematicContext;

const treeWithAngularFire = (declaredVersion: string, section = 'dependencies') => {
  const tree = new HostTree();
  tree.create('package.json', JSON.stringify({
    name: 'test-app',
    [section]: {
      '@angular/fire': declaredVersion,
      firebase: '^12.4.0',
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
    expect(dependenciesIn(tree).firebase).toBe('^12.4.0');
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
    const tree = treeWithFirebase('^12.6.0');
    expect(alignFirebaseVersion(tree, context)).toBeFalse();
    expect(dependenciesIn(tree).firebase).toBe('^12.6.0');
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
      dependencies: { firebase: '^12.6.0' },
      devDependencies: { firebase: '^11.0.0' },
    }, null, 2));
    expect(alignFirebaseVersion(tree, context)).toBeTrue();
    expect(dependenciesIn(tree).firebase).toBe('^12.6.0');
    expect(sectionIn(tree, 'devDependencies').firebase).toBe(firebaseVersionRange);
  });

  it('matches the firebase range the library actually ships with', () => {
    const libraryManifest = JSON.parse(readFileSync('src/package.json', 'utf8'));
    expect(libraryManifest.dependencies.firebase).toBe(firebaseVersionRange);
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
