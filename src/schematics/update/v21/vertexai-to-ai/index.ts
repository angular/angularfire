// The schematic-facing entry point of the Vertex AI -> AI Logic rewrite: resolves the
// compiler, walks the workspace's project roots, runs the per-file pipeline (safety
// analysis, the two scan passes, the getVertexAI edit builders), applies the edits, and
// logs every rewritten or deliberately skipped site.

import { posix } from 'path';
import { SchematicContext, Tree } from '@angular-devkit/schematics';
import type * as ts from 'typescript';
import { overwriteIfExists, safeReadJSON } from '../../../common.js';
import { resolveTypescript } from './compiler.js';
import { collectUsageEdits, scanDeclarations } from './passes.js';
import { collectInjectionConflicts, collectShadowedNames } from './safety.js';
import { BACKEND_CLASS, MODULE_SPECIFIER_REWRITES, REMOVED_SYMBOL_GUIDANCE } from './tables.js';
import type { FileContext, FileRewrite, RegionChange, TextEdit, VertexClassification, VertexImport } from './types.js';
import { buildVertexEdits } from './vertex-edits.js';

const UPGRADE_GUIDE = 'see the AngularFire v21 upgrade guide (docs/version-21-upgrade.md)';

/** The Live API entry points `@angular/fire/ai` exposes. A workspace calling either of them cannot
 * run in `global`, so a region move to `global` breaks it rather than merely relocating it. */
const LIVE_API_ENTRY_POINTS = ['getLiveGenerativeModel', 'startAudioConversation'];

/** Appended to a region warning only when the workspace calls the Live API, so the common case
 * stays short and the case that actually breaks says why. */
const LIVE_API_CAVEAT =
  'This workspace calls the Live API, which Firebase does not support in the global location, ' +
  'so leaving this on global stops getLiveGenerativeModel and startAudioConversation from working. ';

/** What to tell the reader to write. Without the Live API they are restoring a region we know they
 * had, so it is named. With it they are choosing a region we cannot know, so it is not. */
const regionRemedy = (backendReference: string, usesLiveApi: boolean): string => usesLiveApi
  ? `Pass a location that supports the Live API to ${backendReference}, ${UPGRADE_GUIDE}`
  : `Pass new ${backendReference}('us-central1') to keep the region you had, ${UPGRADE_GUIDE}`;

/** One line of the migration log: a position in the file plus the message for it. */
interface LogEntry {
  level: 'info' | 'warn';
  position: number;
  text: string;
}

/**
 * parseDiagnostics is not part of the public SourceFile type but is always populated by
 * createSourceFile at runtime. An error-recovered AST carries unreliable offsets, so a file
 * with syntax errors must never be edited.
 */
interface ParsedSourceFile {
  readonly text: string;
  parseDiagnostics?: readonly unknown[];
}

/**
 * Collect everything needed to move one source file off the old Vertex AI entry points and symbols.
 * Runs the safety analyses, then pass 1 (declarations) and pass 2 (usages plus getVertexAI
 * classification), then builds the getVertexAI edits from the classification.
 *
 * @param fileContext the compiler and parsed source file (never mutated).
 * @returns the edits to apply plus the positions the migration log reports.
 */
const collectEditsForSourceFile = (fileContext: FileContext): FileRewrite => {
  const { sourceFile } = fileContext;
  const scan = scanDeclarations(fileContext, collectShadowedNames(fileContext));
  const vertexBindings = new Map<string, VertexImport>();
  for (const vertexImport of scan.vertexImports) {
    vertexBindings.set(vertexImport.localName, vertexImport);
  }
  const vertex: VertexClassification = { supportedCalls: [], unsupported: [] };
  if (scan.renamedLocalBindings.size > 0 || scan.namespaceBindings.size > 0 || vertexBindings.size > 0) {
    collectUsageEdits(fileContext, scan, vertexBindings, vertex);
  }
  for (const specifier of scan.vertexExportSpecifiers) {
    vertex.unsupported.push({
      position: specifier.getStart(sourceFile),
      reason: 'a re-export of getVertexAI (rewriting it to getAI would silently change its callers\' backend)',
      origin: 'export',
    });
  }
  const injectionConflicts = scan.vertexImports.length > 0 ? collectInjectionConflicts(fileContext) : [];
  const vertexEdits = buildVertexEdits(fileContext, scan, vertex, injectionConflicts);
  return {
    edits: scan.edits.concat(vertexEdits.edits),
    vertexCallPositions: vertexEdits.callPositions,
    defaultedLocations: vertexEdits.defaultedLocations,
    conditionalLocations: vertexEdits.conditionalLocations,
    blockedCallPositions: vertexEdits.blockedCallPositions,
    unsupportedVertexUsages: vertex.unsupported,
    shadowedImports: scan.shadowedImports,
    injectionConflicts: vertexEdits.injectionBlocked ? injectionConflicts : [],
    starExportPositions: scan.starExportPositions,
    removedSymbols: scan.removedSymbols,
  };
};

/** Opens both region warnings: "this call <verb>", or "this call and N others in this file <verb>".
 * The two warnings need different verbs, so both forms are passed in. */
const regionWarningSubject = (others: readonly RegionChange[], singular: string, plural: string): string =>
  others.length === 0
    ? `this call ${singular}`
    : `this call and ${others.length} other${others.length === 1 ? '' : 's'} in this file ${plural}`;

/** The one region warning a file earns, or nothing. getVertexAI defaulted to `us-central1` and
 * AgentPlatformBackend defaults to `global`, so every rewritten call that passed no location
 * changes region. Reported once per file. */
const regionChangeLogEntry = (rewrite: FileRewrite, usesLiveApi: boolean): LogEntry[] => {
  const [change, ...others] = rewrite.defaultedLocations;
  if (change === undefined) { return []; }
  return [{
    level: 'warn',
    position: change.position,
    text: `${regionWarningSubject(others, 'now passes', 'now pass')} no location, ` +
      'so the region changed from us-central1 to global. ' +
      `us-central1 was getVertexAI's default and global is ${BACKEND_CLASS}'s. ` +
      (usesLiveApi ? LIVE_API_CAVEAT : '') +
      regionRemedy(change.backendReference, usesLiveApi),
  }];
};

/** The one warning a file earns for a location that only runtime can resolve. An expression that
 * turns out falsy used to select `us-central1` and now selects `global`. Static analysis cannot
 * tell which, so this says what to check rather than asserting a change. */
const conditionalRegionLogEntry = (rewrite: FileRewrite, usesLiveApi: boolean): LogEntry[] => {
  const [change, ...others] = rewrite.conditionalLocations;
  if (change === undefined) { return []; }
  return [{
    level: 'warn',
    position: change.position,
    text: `${regionWarningSubject(others, 'passes', 'pass')} a location this migration cannot resolve. ` +
      'An empty value used to mean us-central1 and now means global, so the region changes if that expression is ever empty. ' +
      (usesLiveApi ? LIVE_API_CAVEAT : '') +
      `Check it, ${UPGRADE_GUIDE}`,
  }];
};

/**
 * The log lines one file's rewrite produces: an info per rewritten getVertexAI call, one warn when
 * the rewrite moved the file's region, and a warn per site deliberately left for manual migration.
 */
const rewriteLogEntries = (rewrite: FileRewrite, usesLiveApi: boolean): LogEntry[] => [
  ...rewrite.vertexCallPositions.map((position): LogEntry => ({
    level: 'info',
    position,
    text: `rewrote getVertexAI(...) to getAI(..., { backend: new ${BACKEND_CLASS}(...) }) to keep the call on the Agent Platform Gemini API (formerly Vertex AI)`,
  })),
  ...regionChangeLogEntry(rewrite, usesLiveApi),
  ...conditionalRegionLogEntry(rewrite, usesLiveApi),
  ...rewrite.unsupportedVertexUsages.map((usage): LogEntry => ({
    level: 'warn',
    position: usage.position,
    text: `left ${usage.reason}. Plain getAI() uses the Gemini Developer API backend, NOT Vertex AI. Migrate this site by hand, ${UPGRADE_GUIDE}`,
  })),
  ...rewrite.shadowedImports.map((shadow): LogEntry => ({
    level: 'warn',
    position: shadow.position,
    text: `left the \`${shadow.name}\` import name and its usages unrenamed: this file also declares a local named \`${shadow.name}\`, and name-based rewriting cannot tell the two apart. The import path itself still moves to the new entry point, so the leftover name fails to compile there. Migrate this file by hand, ${UPGRADE_GUIDE}`,
  })),
  ...rewrite.injectionConflicts.map((conflict): LogEntry => ({
    level: 'warn',
    position: conflict.position,
    text: `\`${conflict.name}\` is already bound here from a source other than AI Logic, so the backend-preserving rewrite cannot inject or reuse it. The file's getVertexAI code was left as is, and its import path still moves to the new entry point, so the leftover getVertexAI fails to compile there. Migrate it by hand, ${UPGRADE_GUIDE}`,
  })),
  ...rewrite.blockedCallPositions.map((position): LogEntry => ({
    level: 'warn',
    position,
    text: rewrite.injectionConflicts.length > 0
      ? `left a rewritable getVertexAI call unrewritten because this file binds getAI or ${BACKEND_CLASS} from another source (see that warning). Every use of the file's named getVertexAI imports is kept together so the pieces stay consistent, migrate them by hand`
      : 'left a rewritable getVertexAI call unrewritten because another getVertexAI use in this file cannot be rewritten (see its own warning). Every use of the file\'s named getVertexAI imports is kept together so the pieces stay consistent, migrate them by hand',
  })),
  ...rewrite.starExportPositions.map((position): LogEntry => ({
    level: 'warn',
    position,
    text: `left \`export *\` from an old Vertex AI entry point unmigrated: rewriting it would silently rename this file's re-exported public symbols. Re-export what you need by name from '@angular/fire/ai' instead, ${UPGRADE_GUIDE}`,
  })),
  ...rewrite.removedSymbols.map((removed): LogEntry => ({
    level: 'warn',
    position: removed.position,
    text: `left \`${removed.name}\`, which no longer exists in the new entry point (${REMOVED_SYMBOL_GUIDANCE[removed.name]}). The leftover name fails to compile, migrate it by hand, ${UPGRADE_GUIDE}`,
  })),
];

/**
 * Run the rewrite pipeline over one file: parse, collect edits, log the outcome, apply.
 *
 * @returns true when the file changed.
 */
const rewriteFile = (host: Tree, context: SchematicContext, compiler: typeof ts, filePath: string, content: string, usesLiveApi: boolean): boolean => {
  const fileContext: FileContext = {
    compiler,
    sourceFile: compiler.createSourceFile(filePath, content, compiler.ScriptTarget.Latest, true),
  };
  const parsedSourceFile: ParsedSourceFile = fileContext.sourceFile;
  if (parsedSourceFile.parseDiagnostics && parsedSourceFile.parseDiagnostics.length > 0) {
    context.logger.warn(
      `${filePath}: skipped, the file has syntax errors, so the Vertex AI -> AI Logic rewrite cannot run on it safely. Fix the syntax and re-run ng update, or migrate it by hand, ${UPGRADE_GUIDE}`
    );
    return false;
  }
  const rewrite = collectEditsForSourceFile(fileContext);
  for (const entry of rewriteLogEntries(rewrite, usesLiveApi)) {
    const line = fileContext.sourceFile.getLineAndCharacterOfPosition(entry.position).line + 1;
    context.logger[entry.level](`${filePath}:${line}: ${entry.text}`);
  }
  if (rewrite.edits.length === 0) {
    return false;
  }
  let newContent: string;
  try {
    newContent = applyEdits(content, rewrite.edits);
  } catch (error) {
    // The classifiers are meant to keep edits disjoint, so reaching this means a bug. Leaving
    // the file untouched beats corrupting it.
    context.logger.warn(`${filePath}: the Vertex AI -> AI Logic rewrite was skipped for this file (${error}). Migrate it by hand, ${UPGRADE_GUIDE}`);
    return false;
  }
  if (newContent === content) {
    return false;
  }
  overwriteIfExists(host, filePath, newContent);
  return true;
};

/**
 * Apply edits to the source text, back to front so earlier offsets stay valid.
 *
 * @param content the original file text.
 * @param edits the edits to apply. Overlapping spans would slice at stale offsets and corrupt
 *   the output, so they throw instead.
 * @returns the rewritten text.
 */
export const applyEdits = (content: string, edits: TextEdit[]): string => {
  // At equal starts a span must apply before a zero-width insertion at that offset: the pair
  // composes (remove the span, then insert at its former start), while the reverse order would
  // slice the inserted text.
  const sorted = edits.slice().sort((a, b) => b.start - a.start || b.end - a.end);
  for (let index = 1; index < sorted.length; index++) {
    if (sorted[index].end > sorted[index - 1].start) {
      throw new Error(`conflicting rewrite edits at offsets ${sorted[index].start} and ${sorted[index - 1].start}`);
    }
  }
  return sorted.reduce((text, edit) => text.slice(0, edit.start) + edit.replacement + text.slice(edit.end), content);
};

/**
 * The workspace-relative source roots to migrate, from angular.json's projects.
 *
 * `sourceRoot` is already workspace-relative and includes the project root, so it is used
 * directly (falling back to `root`). Joining both would double-count the prefix. A root of ''
 * is the workspace itself (older CLI versions generate that for the root project) and must
 * survive to become '/', not be dropped. Tree paths are always posix, so the roots join with
 * posix separators regardless of the host OS.
 */
const collectSourceRoots = (angularJson: any): string[] =>
  Object.values(angularJson.projects)
    .map((project: any) => project?.sourceRoot || project?.root)
    .filter((base: any) => typeof base === 'string')
    .map((base: string) => {
      const joined = posix.join('/', base);
      // posix.join keeps a trailing slash ('src/' becomes '/src/'), which would defeat the
      // prefix test in shouldVisit and silently skip the project.
      return joined === '/' ? joined : joined.replace(/\/+$/, '');
    });

/**
 * Whether a tree path is a TypeScript source file under one of the source roots. Installed
 * dependencies are excluded: a '/' source root would otherwise pull them in.
 */
const shouldVisit = (filePath: string, srcRoots: string[]): boolean =>
  filePath.endsWith('.ts') &&
  !filePath.endsWith('.d.ts') &&
  !filePath.split('/').includes('node_modules') &&
  srcRoots.some(root => root === '/' || filePath === root || filePath.startsWith(root + '/'));

/**
 * `ng update` migration step: rewrite a workspace's Vertex AI imports and usages onto Firebase AI
 * Logic. Visits the TypeScript files under each project's source root and edits any that import from
 * an old entry point. getVertexAI calls keep their backend: they become
 * `getAI(app, { backend: new AgentPlatformBackend(location?) })`, and every rewritten or skipped
 * getVertexAI site is logged.
 *
 * @param compiler the TypeScript compiler to parse with. Defaults to resolving the workspace's
 *   `typescript` (an optional peer dependency). Callers in environments without `require`
 *   pass their own.
 * @returns true if any file was rewritten.
 */
export const rewriteVertexAIToAI = (host: Tree, context: SchematicContext, compiler?: typeof ts): boolean => {
  const resolvedCompiler = compiler ?? resolveTypescript();
  const angularJson = host.exists('angular.json') && safeReadJSON('angular.json', host);
  if (!angularJson?.projects) {
    return false;
  }
  const srcRoots = collectSourceRoots(angularJson);
  if (srcRoots.length === 0) {
    return false;
  }

  /* Whether the workspace calls the Live API decides how loud the region warning has to be, and a
   * Live API call usually sits in a different file from the getVertexAI call being rewritten. So it
   * is answered across the whole tree before any file is rewritten, rather than per file. */
  let usesLiveApi = false;
  host.visit(filePath => {
    if (usesLiveApi || !shouldVisit(filePath, srcRoots)) {
      return;
    }
    const content = host.read(filePath)?.toString();
    /* Accumulated with `||=` so one matching file anywhere decides it. A plain assignment would
     * let the last file visited overwrite an earlier match, leaving the answer up to walk order. */
    usesLiveApi ||= content !== undefined && LIVE_API_ENTRY_POINTS.some(entryPoint => content.includes(entryPoint));
  });

  let changed = false;
  host.visit(filePath => {
    if (!shouldVisit(filePath, srcRoots)) {
      return;
    }
    const content = host.read(filePath)?.toString();
    if (!content || !Object.keys(MODULE_SPECIFIER_REWRITES).some(specifier => content.includes(specifier))) {
      return;
    }
    if (!resolvedCompiler) {
      context.logger.warn(
        `${filePath} imports a removed Vertex AI entry point, but the Vertex AI -> AI Logic rewrite was skipped: ` +
        'the `typescript` package could not be resolved (it is an optional peer dependency of @angular/fire). ' +
        'Install typescript and re-run, or migrate by hand - see the v21 upgrade guide (docs/version-21-upgrade.md).'
      );
      return;
    }
    changed = rewriteFile(host, context, resolvedCompiler, filePath, content, usesLiveApi) || changed;
  });
  return changed;
};
