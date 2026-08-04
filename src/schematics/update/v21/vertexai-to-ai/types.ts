// The interfaces the rewrite pipeline passes between its stages: text edits, the pass-1 scan
// result, the getVertexAI classification, and the per-file outcome handed back for logging.
// FileContext carries the resolved TypeScript compiler with the parsed file, so no module
// holds compiler state.

import type * as ts from 'typescript';

/** The resolved TypeScript compiler and the parsed file every stage operates on. */
export interface FileContext {
  compiler: typeof ts;
  sourceFile: ts.SourceFile;
}

/** A single text replacement to apply to a source file, as a `[start, end)` span and its new text. */
export interface TextEdit {
  start: number;
  end: number;
  replacement: string;
}

/** A named getVertexAI import discovered in pass 1, resolved to edits only after its usages are classified. */
export interface VertexImport {
  element: ts.ImportSpecifier;
  statement: ts.ImportDeclaration;
  localName: string;
}

/** One getVertexAI occurrence the rewrite intentionally leaves in place, for the migration log. */
export interface UnsupportedVertexUsage {
  position: number;
  reason: string;
  /**
   * 'binding' usages force every named-import getVertexAI edit in the file to be skipped (a
   * half-rewritten binding cannot compile). 'namespace' and 'export' usages only affect themselves.
   */
  origin: 'binding' | 'namespace' | 'export';
}

/** A getVertexAI call whose argument shape the rewrite understands. */
export interface SupportedVertexCall {
  call: ts.CallExpression;
  /** The `location` option's source text when the call passed `{ location: ... }`, else undefined. */
  locationText?: string;
  /** Set for `getVertexAI(...)` through a named import, undefined for `ns.getVertexAI(...)`. */
  binding?: VertexImport;
  /** Set for `ns.getVertexAI(...)`. The backend class is then reached as `ns.VertexAIBackend`. */
  namespaceAccess?: ts.PropertyAccessExpression;
}

/** What classifying every getVertexAI reference in a file produced. */
export interface VertexClassification {
  supportedCalls: SupportedVertexCall[];
  unsupported: UnsupportedVertexUsage[];
}

/** An import binding excluded from the rewrite because a local declaration reuses its name. */
export interface ShadowedImport {
  position: number;
  name: string;
}

/** An imported name that no longer exists in the new entry points (see REMOVED_SYMBOL_GUIDANCE). */
export interface RemovedSymbol {
  position: number;
  name: string;
}

/** What pass 1 (declarations) discovers and hands to pass 2 (usages). */
export interface DeclarationScan {
  edits: TextEdit[];
  /**
   * Un-aliased imported names whose in-file usages must also be renamed (an aliased import
   * keeps its local name, so it is not tracked here).
   */
  renamedLocalBindings: Map<string, string>;
  /**
   * Namespace import names (import * as ns) whose `ns.oldSymbol` accesses must be renamed
   * in both value position (PropertyAccessExpression) and type position (QualifiedName).
   */
  namespaceBindings: Set<string>;
  /** Specifier name tokens already edited in pass 1. The usage pass must not touch them again. */
  editedSpecifierTokenStarts: Set<number>;
  /** Named getVertexAI imports, held back from editing until pass 2 classifies their usages. */
  vertexImports: VertexImport[];
  /**
   * getVertexAI inside `export { ... } from '<old module>'`: always left in place (rewriting it
   * to getAI would silently change which backend the re-export's callers reach).
   */
  vertexExportSpecifiers: ts.ExportSpecifier[];
  /**
   * Import bindings excluded because the file declares a local of the same name: the usage passes
   * match by identifier text, so a shadowed name would get its LOCAL usages silently redirected
   * to the import. Excluded bindings are left whole (loud compile break) and warned about.
   */
  shadowedImports: ShadowedImport[];
  /**
   * `export * from '<old module>'` statements: rewriting the specifier would silently rename the
   * file's re-exported public symbols, so the statement is left whole and warned about.
   */
  starExportPositions: number[];
  /** Imported names that were removed rather than renamed: left as is (loud break) and warned. */
  removedSymbols: RemovedSymbol[];
}

/** The getVertexAI edit set buildVertexEdits produces for one file. */
export interface VertexEdits {
  edits: TextEdit[];
  /** Offsets of getVertexAI calls rewritten to the backend-preserving getAI form, for the log. */
  callPositions: number[];
  /** Offsets of rewritable calls skipped because the file's getVertexAI edits are blocked. */
  blockedCallPositions: number[];
  /** Whether a getAI / VertexAIBackend binding from a non AI Logic source blocked the edits. */
  injectionBlocked: boolean;
}

/** The full result of rewriting one source file. */
export interface FileRewrite {
  edits: TextEdit[];
  /** Offsets of getVertexAI calls rewritten to the backend-preserving getAI form, for the log. */
  vertexCallPositions: number[];
  /** Offsets of rewritable calls skipped because the file's getVertexAI edits are blocked. */
  blockedCallPositions: number[];
  unsupportedVertexUsages: UnsupportedVertexUsage[];
  shadowedImports: ShadowedImport[];
  /** Bindings of getAI / VertexAIBackend from a non AI Logic source that blocked the rewrite. */
  injectionConflicts: ShadowedImport[];
  /** `export * from '<old module>'` statements, always left for manual migration. */
  starExportPositions: number[];
  /** Imported names that were removed rather than renamed: left as is (loud break) and warned. */
  removedSymbols: RemovedSymbol[];
}
