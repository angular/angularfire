import { logging } from '@angular-devkit/core';
import { HostTree, SchematicContext } from '@angular-devkit/schematics';
import { pinInstalledPrereleaseVersion } from './common.js';
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
