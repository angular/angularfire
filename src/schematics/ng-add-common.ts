import { SchematicsException, Tree, SchematicContext } from '@angular-devkit/schematics';
import { FirebaseRc } from './interfaces';
import * as semver from 'semver';

export interface NgAddOptions {
  firebaseProject: string;
  project?: string;
}

export interface NgAddNormalizedOptions {
  firebaseProject: string;
  project: string;
}

export interface DeployOptions {
  project: string;
}

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

function generateFirebaseRcTarget(firebaseProject: string, project: string) {
  return {
    hosting: {
      [project]: [
        // TODO(kirjs): Generally site name is consistent with the project name, but there are edge cases.
        firebaseProject
      ]
    }
  };
}

export function generateFirebaseRc(
  tree: Tree,
  path: string,
  firebaseProject: string,
  project: string
) {
  const firebaseRc: FirebaseRc = tree.exists(path)
    ? safeReadJSON(path, tree)
    : emptyFirebaseRc();

  firebaseRc.targets = firebaseRc.targets || {};

  /* TODO do we want to prompt?
  if (firebaseProject in firebaseRc.targets) {
    throw new SchematicsException(
      `Firebase project ${firebaseProject} already defined in .firebaserc`
    );
  }*/

  firebaseRc.targets[firebaseProject] = generateFirebaseRcTarget(
    firebaseProject,
    project
  );

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

  Object.keys(deps).forEach(depName => {
    const dep = deps[depName];
    if (dep.dev) {
      const existingVersion = packageJson.devDependencies[depName];
      if (existingVersion) {
        if (!semver.intersects(existingVersion, dep.version)) {
          context.logger.warn(`⚠️ The ${depName} devDependency specified in your package.json (${existingVersion}) does not fulfill AngularFire's dependency (${dep.version})`);
          // TODO offer to fix
        }
      } else {
        packageJson.devDependencies[depName] = dep.version;
      }
    } else {
      const existingVersion = packageJson.dependencies[depName];
      if (existingVersion) {
        if (!semver.intersects(existingVersion, dep.version)) {
          context.logger.warn(`⚠️ The ${depName} dependency specified in your package.json (${existingVersion}) does not fulfill AngularFire's dependency (${dep.version})`);
          // TODO offer to fix
        }
      } else {
        packageJson.dependencies[depName] = dep.version;
      }
    }
  });

  overwriteIfExists(host, 'package.json', stringifyFormatted(packageJson));
};
