import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks/index.js';
import { alignFirebaseVersion } from '../../common.js';

/* `ng update` runs this migration again on every prerelease step of the same release (rc.0 to
 * rc.1, rc.1 to 22.0.0), so it must change nothing when the workspace is already aligned. */
export const ngUpdate = (): Rule => (host: Tree, context: SchematicContext) => {
  /* `ng update` updates a `firebase` entry the workspace already has, but adds none to a workspace
   * that has no `firebase` entry at all. Under a peer dependency that workspace needs one. */
  if (alignFirebaseVersion(host, context)) {
    context.addTask(new NodePackageInstallTask());
  }
  return host;
};
