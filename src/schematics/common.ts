import { SchematicsException, Tree, SchematicContext } from '@angular-devkit/schematics';
import { FirebaseHostingSite, FirebaseRc } from './interfaces';
import * as semver from 'semver';

export const shortSiteName = (site?: FirebaseHostingSite) => site?.name && site.name.split('/').pop();

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

function emptyFirebaseRc() {
  return {
    targets: {}
  };
}

function generateFirebaseRcTarget(firebaseProject: string, firebaseHostingSite: FirebaseHostingSite|undefined, project: string) {
  return {
    hosting: {
      [project]: [
        shortSiteName(firebaseHostingSite) ?? firebaseProject
      ]
    }
  };
}

export function generateFirebaseRc(
  tree: Tree,
  path: string,
  firebaseProject: string,
  firebaseHostingSite: FirebaseHostingSite|undefined,
  project: string
) {
  const firebaseRc: FirebaseRc = tree.exists(path)
    ? safeReadJSON(path, tree)
    : emptyFirebaseRc();

  firebaseRc.targets = firebaseRc.targets || {};
  firebaseRc.targets[firebaseProject] = generateFirebaseRcTarget(
    firebaseProject,
    firebaseHostingSite,
    project
  );
  firebaseRc.projects = { default: firebaseProject };

  overwriteIfExists(tree, path, stringifyFormatted(firebaseRc));
}

export function safeReadJSON(path: string, tree: Tree) {
  try {
    // tslint:disable-next-line:no-non-null-assertion
    return JSON.parse(tree.read(path)!.toString());
  } catch (e) {
    throw new SchematicsException(`Error when parsing ${path}: ${e.message}`);
  }
}

export const addDependencies = (
  host: Tree,
  deps: { [name: string]: { dev?: boolean, version: string } },
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
        if (!semver.intersects(existingVersion, dep.version)) {
          context.logger.warn(`⚠️ The ${depName} devDependency specified in your package.json (${existingVersion}) does not fulfill AngularFire's dependency (${dep.version})`);
          // TODO offer to fix
        }
      } catch (e) {
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
