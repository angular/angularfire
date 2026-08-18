import { SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  intersects as semverIntersects,
  prerelease as semverPrerelease,
  satisfies as semverSatisfies,
  subset as semverSubset,
  valid as semverValid,
} from 'semver';
import { FirebaseHostingSite } from './interfaces';

export const shortSiteName = (site?: FirebaseHostingSite) => site?.name?.split('/').pop();

export const stringifyFormatted = (obj: any) => JSON.stringify(obj, null, 2);

export const overwriteIfExists = (
  tree: Tree,
  path: string,
  content: string
) => {
  if (tree.exists(path)) {
    tree.overwrite(path, content);
  } else {
    tree.create(path, content);
  }
};

export function safeReadJSON(path: string, tree: Tree) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return JSON.parse(tree.read(path)!.toString());
  } catch (e) {
    throw new SchematicsException(`Error when parsing ${path}: ${e.message}`);
  }
}

export const addDependencies = (
  host: Tree,
  deps: Record<string, { dev?: boolean, version: string }>,
  context: SchematicContext
) => {
  const packageJson =
    host.exists('package.json') && safeReadJSON('package.json', host);

  if (packageJson === undefined) {
    throw new SchematicsException('Could not locate package.json');
  }

  packageJson.devDependencies ??= {};
  packageJson.dependencies ??= {};

  Object.keys(deps).forEach(depName => {
    const dep = deps[depName];
    const existingDeps = dep.dev ? packageJson.devDependencies : packageJson.dependencies;
    const existingVersion = existingDeps[depName];
    if (existingVersion) {
      try {
        if (!semverIntersects(existingVersion, dep.version)) {
          context.logger.warn(`⚠️ The ${depName} devDependency specified in your package.json (${existingVersion}) does not fulfill AngularFire's dependency (${dep.version})`);
          // TODO offer to fix
        }
      } catch (_) {
        if (existingVersion !== dep.version) {
          context.logger.warn(`⚠️ The ${depName} devDependency specified in your package.json (${existingVersion}) does not fulfill AngularFire's dependency (${dep.version})`);
          // TODO offer to fix
        }
      }
    } else {
      existingDeps[depName] = dep.version;
    }
  });

  overwriteIfExists(host, 'package.json', stringifyFormatted(packageJson));
};

// Must stay identical to `dependencies.firebase` in `src/package.json`: if the two drift, the
// alignment below can pin workspaces outside the range the library actually installs against,
// re-creating the duplicate-SDK trees it exists to prevent.
export const firebaseVersionRange = '^12.4.0';

/**
 * Aligns the workspace's `firebase` entry with the range `@angular/fire` requires.
 *
 * `@angular/fire` bundles its own `firebase` dependency, so a workspace pinned to an older
 * major never conflicts at install time; npm silently nests a second SDK copy under
 * `@angular/fire`, and the two copies reject each other's objects at runtime (#3684, #3681,
 * #3682). Rewriting the workspace's range before the install runs is the only point where
 * that class of breakage can be headed off.
 *
 * Returns whether `package.json` was modified, so callers can skip scheduling an install
 * when nothing changed (`ng update` re-runs the v21 migration on rc-to-stable updates).
 */
export const alignFirebaseVersion = (
  host: Tree,
  context: SchematicContext,
): boolean => {
  if (!host.exists('package.json')) {
    throw new SchematicsException('Could not locate package.json');
  }
  const packageJson = safeReadJSON('package.json', host);

  const sectionsWithFirebase = ['dependencies', 'devDependencies'].filter(
    section => typeof packageJson[section]?.firebase === 'string',
  );

  if (sectionsWithFirebase.length === 0) {
    packageJson.dependencies ??= {};
    packageJson.dependencies.firebase = firebaseVersionRange;
    context.logger.info(`Added firebase ${firebaseVersionRange} to your package.json.`);
    overwriteIfExists(host, 'package.json', stringifyFormatted(packageJson));
    return true;
  }

  let changed = false;
  for (const section of sectionsWithFirebase) {
    const declaredFirebaseVersion = packageJson[section].firebase;
    let alreadyCompatible: boolean;
    try {
      alreadyCompatible = semverSubset(declaredFirebaseVersion, firebaseVersionRange);
    } catch (_) {
      context.logger.warn(
        `⚠️ The firebase version in your package.json (${declaredFirebaseVersion}) is not a semver ` +
        `range, so it was left as-is; make sure it resolves inside ${firebaseVersionRange}, the ` +
        'range @angular/fire requires; a version outside it can leave the install with two copies of the firebase SDK.'
      );
      continue;
    }
    if (alreadyCompatible) { continue; }
    packageJson[section].firebase = firebaseVersionRange;
    context.logger.info(
      `Updated the firebase version in your package.json from ${declaredFirebaseVersion} to ` +
      `${firebaseVersionRange}, the range @angular/fire requires; a workspace range outside it ` +
      'can leave the install with a second copy of the firebase SDK, which fails at runtime.'
    );
    changed = true;
  }

  if (changed) {
    overwriteIfExists(host, 'package.json', stringifyFormatted(packageJson));
  }
  return changed;
};

// The build writes the published version over this placeholder in the compiled schematics
// (tools/build.ts, replaceSchematicVersions); running from source leaves the placeholder.
const angularFireVersion = 'ANGULARFIRE2_VERSION';

/**
 * Pins the workspace's `@angular/fire` entry to the exact installed version when `ng add` wrote a
 * prerelease range. A prerelease range like `^21.0.0-rc.0` also matches the canary build published
 * for every merge to main, so a later fresh install can silently replace the version the user
 * chose. Stable ranges are left untouched.
 */
export const pinInstalledPrereleaseVersion = (
  host: Tree,
  context: SchematicContext,
  installedVersion = angularFireVersion,
) => {
  if (!host.exists('package.json')) { return; }
  const packageJson = safeReadJSON('package.json', host);

  const dependencySection = ['dependencies', 'devDependencies'].find(
    section => typeof packageJson[section]?.['@angular/fire'] === 'string',
  );
  if (!dependencySection) { return; }

  const declaredAngularFireVersion = packageJson[dependencySection]['@angular/fire'];
  if (!(declaredAngularFireVersion.startsWith('^') || declaredAngularFireVersion.startsWith('~'))) { return; }

  if (!semverValid(installedVersion)) {
    context.logger.warn(
      'Could not determine the installed @angular/fire version; leaving the declared version range as-is.'
    );
    return;
  }

  if (
    semverPrerelease(installedVersion) &&
    semverSatisfies(installedVersion, declaredAngularFireVersion, { includePrerelease: true })
  ) {
    packageJson[dependencySection]['@angular/fire'] = installedVersion;
    overwriteIfExists(host, 'package.json', stringifyFormatted(packageJson));
    context.logger.info(
      `Pinned @angular/fire to the exact version ${installedVersion} — a prerelease range like ` +
      `${declaredAngularFireVersion} also matches unreviewed canary builds, so a later install ` +
      'could silently change versions.'
    );
  }
};
