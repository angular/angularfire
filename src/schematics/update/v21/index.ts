import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
// The explicit index.js subpath keeps this importable from the ESM jasmine run; the bare
// /tasks directory specifier only resolves under CommonJS.
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks/index.js';
import { alignFirebaseVersion } from '../../common.js';
import { rewriteVertexAIToAI } from './vertexai-to-ai.js';

// ng update re-runs this migration on rc-to-stable transitions (the CLI clamps the migration
// range's upper bound to the release version), so it must stay a no-op when nothing changes.
export const ngUpdate = (): Rule => (
  host: Tree,
  context: SchematicContext
) => {
  // Rewrite Vertex AI imports to AI Logic (source-only edits, no dependency change).
  rewriteVertexAIToAI(host, context);
  // Align firebase. This step changes dependencies, so only it schedules an install.
  if (alignFirebaseVersion(host, context)) {
    context.addTask(new NodePackageInstallTask());
  }
  return host;
};
