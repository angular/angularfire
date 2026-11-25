/**
 * @fileoverview What `ng add` and `ng deploy` need to know about how an Angular project builds,
 * read from the project's `build` entry in angular.json: whether the build needs a server, where
 * its browser files go, and which file is the client-side page. The rules mirror
 * `@angular/build`'s application builder.
 */

import { basename } from 'path';
import { WorkspaceProject } from './interfaces';

/** The options of a `build` entry in angular.json, whose values this file checks before using. */
export type BuildOptions = Record<string, unknown>;

/** One entry under a project's `architect` key in angular.json, such as its `build` entry. */
export type BuildTargetDefinition = NonNullable<WorkspaceProject['architect']>[string];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** The options `ng deploy` builds with: the `build` target's options overlaid by its `production` configuration. */
export const productionBuildOptions = (buildTarget: BuildTargetDefinition | undefined): BuildOptions => ({
  ...buildTarget?.options,
  ...buildTarget?.configurations?.production,
});

/**
 * What `ng add` and `ng deploy` tell the user about Firebase Hosting when the build has the
 * `localize` option. Such a build writes one folder per locale and no index page above them.
 */
export const localizedBuildHostingWarning =
  'This app is built once per locale (the "localize" build option), which puts each locale in ' +
  'its own folder with no index.html above them. The Hosting entry in firebase.json serves a ' +
  'single index.html, so pages will not load until that entry is changed by hand to serve the ' +
  'locale folders.';

/** Whether the build produces a server that renders pages per request, which static hosting cannot run. */
export const rendersOnServer = (options: BuildOptions): boolean => {
  if (options.outputMode === 'server') { return true; }
  if (options.outputMode === 'static') { return false; }
  return !!options.ssr && !!options.server;
};

/**
 * The name the build gives its index page, from the `index` build option. That option is either
 * the path of the source file, whose own file name is then used, or an object whose `output` is
 * the name. Without either, the name is `index.html`.
 */
const indexFileName = (options: BuildOptions): string => {
  const { index } = options;
  if (typeof index === 'string') { return basename(index); }
  if (isRecord(index) && typeof index.output === 'string' && index.output) { return basename(index.output); }
  return 'index.html';
};

/**
 * The file a static host should serve for a route that has no file of its own, which is the
 * build's index page. When the build also prerenders or renders on a server, the application
 * builder writes an index page called `index.html` as `index.csr.html` instead. A page with
 * another name keeps its name.
 */
export const clientSidePage = (options: BuildOptions): string => {
  const fileName = indexFileName(options);
  const prerendersOrRendersOnServer = options.outputMode
    ? !!options.server
    : !!options.ssr || !!options.prerender;
  return prerendersOrRendersOnServer && fileName === 'index.html' ? 'index.csr.html' : fileName;
};

/** The directory the browser files are built into, relative to the workspace root, with forward slashes. */
export const browserOutputDirectory = (
  projectName: string,
  buildTarget: BuildTargetDefinition | undefined,
): string => {
  const { outputPath } = productionBuildOptions(buildTarget);
  const withoutTrailingSlash = (path: string) => path.replace(/\\/g, '/').replace(/\/+$/, '');

  /* Only the application builder nests browser files in a subdirectory. The older builders write
   * them straight into `outputPath`. */
  if (!buildTarget?.builder.endsWith(':application')) {
    return withoutTrailingSlash(typeof outputPath === 'string' ? outputPath : `dist/${projectName}`);
  }

  const base = typeof outputPath === 'string' ? outputPath
    : isRecord(outputPath) && typeof outputPath.base === 'string' ? outputPath.base
    : `dist/${projectName}`;
  const browser = isRecord(outputPath) && typeof outputPath.browser === 'string' ? outputPath.browser : 'browser';
  return withoutTrailingSlash(browser ? `${withoutTrailingSlash(base)}/${browser}` : base);
};
