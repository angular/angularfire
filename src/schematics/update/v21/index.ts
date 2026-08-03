import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
// The explicit index.js subpath keeps this importable from the ESM jasmine run. The bare
// /tasks directory specifier only resolves under CommonJS.
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks/index.js';
import type * as ts from 'typescript';
import { alignFirebaseVersion } from '../../common.js';
import { rewriteVertexAIToAI } from './vertexai-to-ai/index.js';

// ng update re-runs this migration on rc-to-stable transitions (the CLI clamps the migration
// range's upper bound to the release version), so it must stay a no-op when nothing changes.
export const ngUpdate = (options?: { compiler?: typeof ts }): Rule => (
  host: Tree,
  context: SchematicContext
) => {
  // Align firebase before anything else: it is the one step users cannot do without, so no
  // failure below may cost it. This step changes dependencies, so only it schedules an install.
  if (alignFirebaseVersion(host, context)) {
    context.addTask(new NodePackageInstallTask());
  }
  // Rewrite Vertex AI imports to AI Logic (source-only edits, no dependency change). Guarded so
  // an unexpected rewrite failure costs only the rewrite, never the alignment above.
  try {
    rewriteVertexAIToAI(host, context, options?.compiler);
  } catch (error) {
    context.logger.warn(
      `Skipped the Vertex AI -> AI Logic source rewrite: ${error}. ` +
      'Any remaining @angular/fire/vertexai imports need a manual migration - see the v21 upgrade guide (docs/version-21-upgrade.md).'
    );
  }
  return host;
};
