import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { asWindowsPath, normalize } from '@angular-devkit/core';
import { SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  gte as semverGte,
  intersects as semverIntersects,
  minVersion as semverMinVersion,
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

/* Must stay identical to `peerDependencies.firebase` in `src/package.json`: if the two drift, the
 * alignment below keeps or writes a range the peer dependency then rejects. */
export const supportedFirebaseRange = '^12.18.0 || ^13.0.0';

export const firebaseVersionRange = '^12.18.0';
export const firebase13VersionRange = '^13.0.0';

/* The directory the tree is rooted at. No public API exposes it, and the setup schematic reads the
 * same private field. An in-memory tree has none. */
const treeRootDirectory = (host: Tree): string | undefined => {
  const root: unknown = Reflect.get(Reflect.get(host, '_backend') ?? {}, '_root');
  if (typeof root !== 'string') { return undefined; }
  return process.platform.startsWith('win32') ? asWindowsPath(normalize(root)) : root;
};

/* Returns the contents of the installed firebase's package.json, or undefined when none is found. */
const firebaseManifestText = (host: Tree): string | undefined => {
  const inTree = host.read('node_modules/firebase/package.json');
  if (inTree) { return inTree.toString('utf-8'); }
  /* npm and yarn workspaces install into the monorepo root, above the tree, so walk up from the
   * workspace the way Node resolves a package. */
  const treeRoot = treeRootDirectory(host);
  for (let directory = treeRoot; directory; directory = dirname(directory) === directory ? undefined : dirname(directory)) {
    try {
      return readFileSync(join(directory, 'node_modules', 'firebase', 'package.json'), 'utf-8');
    } catch (_) {
      continue;
    }
  }
  return undefined;
};

/* Returns the version of firebase installed in the workspace, or undefined when none is found or it
 * cannot be read. alignFirebaseVersion uses it to write a package.json firebase range that keeps the
 * installed major. */
const installedFirebaseVersion = (host: Tree, context: SchematicContext): string | undefined => {
  const manifestText = firebaseManifestText(host);
  if (manifestText === undefined) { return undefined; }
  let version: unknown;
  try {
    version = JSON.parse(manifestText).version;
  } catch (_) {
    version = undefined;
  }
  const valid = typeof version === 'string' ? semverValid(version) : null;
  if (!valid) {
    context.logger.debug('The installed firebase package.json has no readable version, so the firebase range comes from package.json alone.');
  }
  return valid ?? undefined;
};

/* Writes the range of the major already installed. `ng add` installs the missing peer before this
 * runs, at the newest version the peer range allows, and writing an older major then makes the
 * reinstall leave two @firebase/app copies. An installed copy that the workspace's own entry
 * excludes is stale and ignored. Without a usable installed copy, an entry that starts at 13 gets
 * the 13 range and anything else the 12 range. */
const replacementFirebaseRange = (installedVersion: string | undefined, declaredFirebaseVersion?: string) => {
  const installedMatchesEntry = installedVersion !== undefined &&
    (declaredFirebaseVersion === undefined || semverSatisfies(installedVersion, declaredFirebaseVersion));
  const installedRange = !installedMatchesEntry ? undefined : [firebase13VersionRange, firebaseVersionRange].find(
    range => semverSatisfies(installedVersion, range),
  );
  if (installedRange) { return installedRange; }
  const lowestDeclared = declaredFirebaseVersion ? semverMinVersion(declaredFirebaseVersion) : null;
  return lowestDeclared && semverGte(lowestDeclared, '13.0.0-0') ? firebase13VersionRange : firebaseVersionRange;
};

/**
 * Aligns the workspace's `firebase` entry with the range `@angular/fire` requires.
 *
 * `firebase` is a peer dependency of `@angular/fire`. Depending on the package manager and its
 * settings, a workspace range outside it is refused at install time or installs a `firebase`
 * the library does not support, and a workspace that never declared `firebase` gets no
 * entry written. Rewriting the entry before the install runs heads both off.
 *
 * Returns whether `package.json` was modified, so callers can skip scheduling an install
 * when nothing changed (`ng update` re-runs a migration on rc-to-stable updates).
 */
export const alignFirebaseVersion = (
  host: Tree,
  context: SchematicContext,
): boolean => {
  if (!host.exists('package.json')) {
    throw new SchematicsException('Could not locate package.json');
  }
  const packageJson = safeReadJSON('package.json', host);
  const installedVersion = installedFirebaseVersion(host, context);

  const sectionsWithFirebase = ['dependencies', 'devDependencies'].filter(
    section => typeof packageJson[section]?.firebase === 'string',
  );

  if (sectionsWithFirebase.length === 0) {
    const added = replacementFirebaseRange(installedVersion);
    packageJson.dependencies ??= {};
    packageJson.dependencies.firebase = added;
    context.logger.info(`Added firebase ${added} to your package.json.`);
    overwriteIfExists(host, 'package.json', stringifyFormatted(packageJson));
    return true;
  }

  let changed = false;
  for (const section of sectionsWithFirebase) {
    const declaredFirebaseVersion = packageJson[section].firebase;
    let alreadyCompatible: boolean;
    try {
      alreadyCompatible = semverSubset(declaredFirebaseVersion, supportedFirebaseRange);
    } catch (_) {
      context.logger.warn(
        `⚠️ The firebase version in your package.json (${declaredFirebaseVersion}) is not a semver ` +
        `range, so it was left as-is. Make sure it resolves inside ${supportedFirebaseRange}, the ` +
        'range @angular/fire supports. A version outside it either fails to install or installs a firebase that @angular/fire does not support.'
      );
      continue;
    }
    if (alreadyCompatible) { continue; }
    const replacement = replacementFirebaseRange(installedVersion, declaredFirebaseVersion);
    packageJson[section].firebase = replacement;
    context.logger.info(
      `Updated the firebase version in your package.json from ${declaredFirebaseVersion} to ` +
      `${replacement}. @angular/fire supports ${supportedFirebaseRange}, and a range outside it either fails ` +
      'to install or installs a firebase that @angular/fire does not support.'
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
 * prerelease range. A prerelease range like `^21.0.0-rc.0` also matches every later prerelease of
 * the same release, so a later fresh install can silently replace the version the user chose.
 * Stable ranges are left untouched.
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
      `${declaredAngularFireVersion} also matches later prereleases, so a later install ` +
      'could silently change versions.'
    );
  }
};
