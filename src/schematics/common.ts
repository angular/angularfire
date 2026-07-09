import { readFileSync } from 'fs';
import { join } from 'path';
import { SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  intersects as semverIntersects,
  prerelease as semverPrerelease,
  satisfies as semverSatisfies,
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

/**
 * Reads the exact version of the installed `@angular/fire` package from its own manifest — the
 * compiled schematics run from `<package root>/schematics/<entry>/`, so the manifest sits two
 * directories up. Returns undefined when that layout doesn't hold (e.g. running from source),
 * so callers skip pinning instead of failing the schematic.
 */
const readInstalledVersion = () => {
  try {
    return JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json')).toString()).version;
  } catch {
    return undefined;
  }
};

/**
 * Pins the workspace's `@angular/fire` entry to the exact installed version when `ng add` wrote a
 * prerelease range. A prerelease range like `^21.0.0-rc.0` also matches the canary build published
 * for every merge to main, so a later fresh install can silently replace the version the user
 * chose. Stable ranges are left untouched.
 */
export const pinInstalledPrereleaseVersion = (
  host: Tree,
  context: SchematicContext,
  installedVersion = readInstalledVersion(),
) => {
  if (!host.exists('package.json')) { return; }
  const packageJson = safeReadJSON('package.json', host);

  const declaredAngularFireVersion = packageJson.dependencies?.['@angular/fire'];
  if (
    typeof declaredAngularFireVersion !== 'string' ||
    !(declaredAngularFireVersion.startsWith('^') || declaredAngularFireVersion.startsWith('~'))
  ) { return; }

  if (
    semverValid(installedVersion) &&
    semverPrerelease(installedVersion) &&
    semverSatisfies(installedVersion, declaredAngularFireVersion, { includePrerelease: true })
  ) {
    packageJson.dependencies['@angular/fire'] = installedVersion;
    overwriteIfExists(host, 'package.json', stringifyFormatted(packageJson));
    context.logger.info(
      `Pinned @angular/fire to the exact version ${installedVersion} — a prerelease range like ` +
      `${declaredAngularFireVersion} also matches unreviewed canary builds, so a later install ` +
      'could silently change versions.'
    );
  }
};
