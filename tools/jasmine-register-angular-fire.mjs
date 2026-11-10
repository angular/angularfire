/**
 * @fileoverview Installs the `@angular/fire` resolve hook before any spec is loaded.
 *
 * The `test:node` and `test:node-esm` scripts preload this file with Node's `--import` flag, so it
 * runs before `tools/jasmine.ts` and before jasmine imports the first spec. It does nothing but
 * register `angular-fire-resolve-hook.mjs`.
 */

import * as nodeModule from 'node:module';
import { resolve as resolvePath } from 'node:path';
import { pathToFileURL } from 'node:url';
import { initialize, resolve } from './angular-fire-resolve-hook.mjs';

const data = { packageRoot: pathToFileURL(resolvePath('dist/packages-dist') + '/').href };

// registerHooks runs the hook on the main thread and replaces register, which Node 26 deprecates. Node 20 has only register.
if (typeof nodeModule.registerHooks === 'function') {
  initialize(data);
  nodeModule.registerHooks({ resolve });
} else {
  nodeModule.register('./angular-fire-resolve-hook.mjs', import.meta.url, { data });
}
