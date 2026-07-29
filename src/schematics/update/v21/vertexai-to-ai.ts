import { posix } from 'path';
import { SchematicContext, Tree } from '@angular-devkit/schematics';
import * as ts from 'typescript';
import { overwriteIfExists, safeReadJSON } from '../../common.js';

const OLD_MODULE_SPECIFIERS = ['@angular/fire/vertexai', '@angular/fire/vertexai-preview'];
const NEW_MODULE_SPECIFIER = '@angular/fire/ai';

const SYMBOL_RENAMES: Record<string, string> = {
  getVertexAI: 'getAI',
  provideVertexAI: 'provideAI',
  VertexAI: 'AI',
  VertexAIInstances: 'AIInstances',
  vertexAIInstance$: 'AIInstance$',
  VertexAIModule: 'AIModule',
};

/** A single text replacement to apply to a source file, as a `[start, end)` span and its new text. */
interface TextEdit {
  start: number;
  end: number;
  replacement: string;
}

/** What pass 1 (declarations) discovers and hands to pass 2 (usages). */
interface DeclarationScan {
  edits: TextEdit[];
  // Un-aliased imported names whose in-file usages must also be renamed (an aliased import
  // keeps its local name, so it is not tracked here).
  renamedLocalBindings: Map<string, string>;
  // Namespace import names (import * as ns) whose `ns.oldSymbol` accesses must be renamed
  // in both value position (PropertyAccessExpression) and type position (QualifiedName).
  namespaceBindings: Set<string>;
  // Specifier name tokens already edited in pass 1. The usage pass must not touch them again.
  editedSpecifierTokenStarts: Set<number>;
}

/**
 * Collect every edit needed to move one source file off the old Vertex AI entry points and symbols.
 * Runs in two passes: pass 1 rewrites the import/export declarations and records which local
 * bindings are in play, then pass 2 rewrites their usages.
 *
 * @param sourceFile the parsed source file to inspect (never mutated).
 * @returns the edits to apply, possibly empty.
 */
const collectEditsForSourceFile = (sourceFile: ts.SourceFile): TextEdit[] => {
  const scan = scanDeclarations(sourceFile);
  if (scan.renamedLocalBindings.size === 0 && scan.namespaceBindings.size === 0) {
    return scan.edits;
  }
  collectUsageEdits(sourceFile, scan);
  return scan.edits;
};

/**
 * Pass 1: rewrite the module specifier and renamed symbols of every import/export declaration that
 * pulls from an old Vertex AI entry point, and record the bindings whose usages pass 2 must rewrite.
 *
 * @param sourceFile the parsed source file.
 * @returns the accumulated edits plus the binding maps for pass 2.
 */
const scanDeclarations = (sourceFile: ts.SourceFile): DeclarationScan => {
  const scan: DeclarationScan = {
    edits: [],
    renamedLocalBindings: new Map<string, string>(),
    namespaceBindings: new Set<string>(),
    editedSpecifierTokenStarts: new Set<number>(),
  };
  for (const statement of sourceFile.statements) {
    collectDeclarationEdits(statement, sourceFile, scan);
  }
  return scan;
};

/**
 * Handle one top-level statement in pass 1. A no-op unless the statement imports or exports from an
 * old Vertex AI entry point, in which case it edits the module specifier and dispatches its bindings.
 *
 * @param statement the top-level statement to inspect.
 * @param sourceFile the file it belongs to (for token offsets).
 * @param scan accumulator mutated in place.
 */
const collectDeclarationEdits = (statement: ts.Statement, sourceFile: ts.SourceFile, scan: DeclarationScan): void => {
  const isImport = ts.isImportDeclaration(statement);
  const isExport = ts.isExportDeclaration(statement);
  if (!isImport && !isExport) {
    return;
  }
  const moduleSpecifier = statement.moduleSpecifier;
  if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier) || !OLD_MODULE_SPECIFIERS.includes(moduleSpecifier.text)) {
    return;
  }

  // Rewrite the module specifier text, preserving the surrounding quotes.
  scan.edits.push({
    start: moduleSpecifier.getStart(sourceFile) + 1,
    end: moduleSpecifier.getEnd() - 1,
    replacement: NEW_MODULE_SPECIFIER,
  });

  const namedBindings = isImport ? statement.importClause?.namedBindings : statement.exportClause;
  if (namedBindings && ts.isNamespaceImport(namedBindings)) {
    scan.namespaceBindings.add(namedBindings.name.text);
    return;
  }
  if (namedBindings && (ts.isNamedImports(namedBindings) || ts.isNamedExports(namedBindings))) {
    for (const element of namedBindings.elements) {
      collectSpecifierEdit(element, isImport, sourceFile, scan);
    }
  }
};

/**
 * Rename a renamed symbol inside one named import/export specifier, and, for an un-aliased import,
 * record its local binding so pass 2 rewrites that binding's usages.
 *
 * @param element the `{ x }` or `{ x as y }` specifier.
 * @param isImport whether the specifier belongs to an import (only imports create a local binding).
 * @param sourceFile the file it belongs to (for token offsets).
 * @param scan accumulator mutated in place.
 */
const collectSpecifierEdit = (
  element: ts.ImportSpecifier | ts.ExportSpecifier,
  isImport: boolean,
  sourceFile: ts.SourceFile,
  scan: DeclarationScan,
): void => {
  const importedNameNode = element.propertyName ?? element.name;
  const newName = SYMBOL_RENAMES[importedNameNode.text];
  if (!newName) {
    return;
  }
  scan.edits.push({
    start: importedNameNode.getStart(sourceFile),
    end: importedNameNode.getEnd(),
    replacement: newName,
  });
  scan.editedSpecifierTokenStarts.add(importedNameNode.getStart(sourceFile));
  if (isImport && !element.propertyName) {
    scan.renamedLocalBindings.set(element.name.text, newName);
  }
};

/**
 * Pass 2: walk the whole tree and rewrite usages of the bindings found in pass 1, namely renamed
 * local identifiers and `ns.oldSymbol` member accesses.
 *
 * @param sourceFile the parsed source file.
 * @param scan the pass-1 result, whose `edits` is extended in place.
 */
const collectUsageEdits = (sourceFile: ts.SourceFile, scan: DeclarationScan): void => {
  const visit = (node: ts.Node): void => {
    const namespaceEdit = namespaceMemberEdit(node, scan.namespaceBindings, sourceFile);
    if (namespaceEdit) {
      scan.edits.push(namespaceEdit);
    }
    if (ts.isIdentifier(node)) {
      const usageEdit = identifierUsageEdit(node, scan, sourceFile);
      if (usageEdit) {
        scan.edits.push(usageEdit);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
};

/**
 * Build the edit for a namespaced `ns.oldSymbol` access, in value position (a PropertyAccessExpression
 * like `ns.getVertexAI()`) or type position (a QualifiedName like `let x: ns.VertexAI`).
 *
 * @returns the edit, or undefined when the node is not a renamable namespace access.
 */
const namespaceMemberEdit = (node: ts.Node, namespaceBindings: Set<string>, sourceFile: ts.SourceFile): TextEdit | undefined => {
  if (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    namespaceBindings.has(node.expression.text) &&
    SYMBOL_RENAMES[node.name.text]
  ) {
    return { start: node.name.getStart(sourceFile), end: node.name.getEnd(), replacement: SYMBOL_RENAMES[node.name.text] };
  }
  if (
    ts.isQualifiedName(node) &&
    ts.isIdentifier(node.left) &&
    namespaceBindings.has(node.left.text) &&
    SYMBOL_RENAMES[node.right.text]
  ) {
    return { start: node.right.getStart(sourceFile), end: node.right.getEnd(), replacement: SYMBOL_RENAMES[node.right.text] };
  }
  return undefined;
};

/**
 * Build the edit for an identifier that references an un-aliased renamed import. Returns undefined for
 * look-alikes that are not references to the import: the import/export specifier itself, member names,
 * property/accessor/enum declaration names, and destructuring keys.
 *
 * @returns the edit, or undefined when the identifier should be left as is.
 */
const identifierUsageEdit = (node: ts.Identifier, scan: DeclarationScan, sourceFile: ts.SourceFile): TextEdit | undefined => {
  const replacement = scan.renamedLocalBindings.get(node.text);
  if (replacement === undefined) {
    return undefined;
  }
  const start = node.getStart(sourceFile);
  if (scan.editedSpecifierTokenStarts.has(start)) {
    return undefined;
  }
  const parent = node.parent;

  // Import specifier name: already handled in pass 1.
  if (ts.isImportSpecifier(parent) && (parent.propertyName === node || parent.name === node)) {
    return undefined;
  }
  // A bare local re-export `export { VertexAI }` (no `from`) is a usage of the renamed local
  // binding. Preserve the external export name by expanding to `export { AI as VertexAI }`. An
  // `export { x } from '...'` specifier is instead handled in pass 1.
  if (ts.isExportSpecifier(parent) && parent.name === node && !parent.propertyName) {
    const exportDeclaration = parent.parent.parent;
    if (ts.isExportDeclaration(exportDeclaration) && !exportDeclaration.moduleSpecifier) {
      return { start, end: node.getEnd(), replacement: `${replacement} as ${node.text}` };
    }
    return undefined;
  }
  // `{ getVertexAI }` is shorthand for `{ getVertexAI: getVertexAI }`. Only the value changed, so
  // expand it rather than rename the key.
  if (ts.isShorthandPropertyAssignment(parent) && parent.name === node) {
    return { start: node.getEnd(), end: node.getEnd(), replacement: `: ${replacement}` };
  }
  // A destructuring key or shorthand binding target (`const { getVertexAI } = x` or
  // `const { getVertexAI: local } = x`) reads a property, not the import, so leave it. A binding
  // initializer (`{ cb = getVertexAI }`) is a real usage and is not matched by this branch.
  if (ts.isBindingElement(parent) && (parent.propertyName === node || (parent.name === node && !parent.propertyName))) {
    return undefined;
  }
  if (isMemberOrDeclaredName(node, parent)) {
    return undefined;
  }
  return { start, end: node.getEnd(), replacement };
};

/**
 * Whether an identifier is a member-access name (`obj.getVertexAI`) or a declared
 * property/accessor/enum-member name rather than a value reference to the import.
 */
const isMemberOrDeclaredName = (node: ts.Identifier, parent: ts.Node): boolean => {
  const isMemberName =
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    (ts.isQualifiedName(parent) && parent.right === node);
  const isDeclaredPropertyName =
    (ts.isPropertyAssignment(parent) ||
      ts.isPropertyDeclaration(parent) ||
      ts.isPropertySignature(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isGetAccessorDeclaration(parent) ||
      ts.isSetAccessorDeclaration(parent) ||
      ts.isEnumMember(parent)) &&
    parent.name === node;
  return isMemberName || isDeclaredPropertyName;
};

/**
 * Apply edits to the source text.
 *
 * @param content the original file text.
 * @param edits non-overlapping edits. Applied back to front so earlier offsets stay valid.
 * @returns the rewritten text.
 */
const applyEdits = (content: string, edits: TextEdit[]): string => {
  return edits
    .slice()
    .sort((a, b) => b.start - a.start)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.replacement + text.slice(edit.end), content);
};

/**
 * `ng update` migration step: rewrite a workspace's Vertex AI imports and usages onto Firebase AI
 * Logic. Visits the TypeScript files under each project's source root and edits any that import from
 * an old entry point.
 *
 * @returns true if any file was rewritten.
 */
export const rewriteVertexAIToAI = (host: Tree, _context: SchematicContext): boolean => {
  const angularJson = host.exists('angular.json') && safeReadJSON('angular.json', host);
  if (!angularJson?.projects) {
    return false;
  }
  // angular.json's `sourceRoot` is already workspace-relative and includes the project root,
  // so use it directly (falling back to `root`). Joining both would double-count the prefix.
  // Tree paths are always posix, so join with posix separators regardless of the host OS.
  const srcRoots: string[] = Object.values(angularJson.projects)
    .map((project: any) => project.sourceRoot || project.root)
    .filter((base: string) => !!base)
    .map((base: string) => posix.join('/', base));
  if (srcRoots.length === 0) {
    return false;
  }

  let changed = false;
  host.visit(filePath => {
    if (
      !filePath.endsWith('.ts') ||
      filePath.endsWith('.d.ts') ||
      !srcRoots.find(root => filePath === root || filePath.startsWith(root + '/'))
    ) {
      return;
    }
    const content = host.read(filePath)?.toString();
    if (!content || !OLD_MODULE_SPECIFIERS.some(specifier => content.includes(specifier))) {
      return;
    }
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
    const edits = collectEditsForSourceFile(sourceFile);
    if (edits.length === 0) {
      return;
    }
    const newContent = applyEdits(content, edits);
    if (newContent !== content) {
      overwriteIfExists(host, filePath, newContent);
      changed = true;
    }
  });
  return changed;
};
