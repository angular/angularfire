// The two per-file scan passes. Pass 1 walks the top-level import/export declarations, edits
// module specifiers and renamed symbols, and records the bindings in play. Pass 2 walks the
// whole tree, rewrites usages of renamed bindings, and classifies every getVertexAI reference
// for the backend-preserving call rewrite built in vertex-edits.ts.

import type * as ts from 'typescript';
import { forEachNodeDeep } from './ast-walk.js';
import { GET_VERTEX_AI, MODULE_SPECIFIER_REWRITES, REMOVED_SYMBOL_GUIDANCE, SYMBOL_RENAMES } from './tables.js';
import type { DeclarationScan, FileContext, RemovedSymbol, SupportedVertexCall, TextEdit, VertexClassification, VertexImport } from './types.js';

/** The binding groups pass 2 edits by name, used to detect edit sites inside an options literal. */
interface EditableBindings {
  renamedNames: Set<string>;
  namespaceNames: Set<string>;
  vertexNames: Set<string>;
}

/** How one getVertexAI options argument maps onto the backend rewrite. */
interface OptionsClassification {
  supported: boolean;
  /** The `location` property's source text, when present. */
  locationText?: string;
  /** True when the literal contains an edit site pass 2 would also rewrite (see containsEditSite). */
  conflicting?: boolean;
}

/**
 * Pass 1: rewrite the module specifier and renamed symbols of every import/export declaration that
 * pulls from an old Vertex AI entry point, and record the bindings whose usages pass 2 must rewrite.
 *
 * @param fileContext the compiler and parsed source file.
 * @param shadowedNames tracked local names a local declaration shadows (see safety.ts).
 * @returns the accumulated edits plus the binding maps for pass 2.
 */
export const scanDeclarations = (fileContext: FileContext, shadowedNames: Set<string>): DeclarationScan => {
  const { sourceFile } = fileContext;
  const scan: DeclarationScan = {
    edits: [],
    renamedLocalBindings: new Map<string, string>(),
    namespaceBindings: new Set<string>(),
    editedSpecifierTokenStarts: new Set<number>(),
    vertexImports: [],
    vertexExportSpecifiers: [],
    shadowedImports: [],
    starExportPositions: [],
    removedSymbols: [],
  };
  for (const statement of sourceFile.statements) {
    collectDeclarationEdits(statement, fileContext, scan, shadowedNames);
  }
  return scan;
};

/**
 * Handle one top-level statement in pass 1. A no-op unless the statement imports or exports from an
 * old Vertex AI entry point, in which case it edits the module specifier and dispatches its bindings.
 *
 * @param statement the top-level statement to inspect.
 * @param fileContext the compiler and parsed source file (for token offsets).
 * @param scan accumulator mutated in place.
 * @param shadowedNames tracked local names a local declaration shadows.
 */
const collectDeclarationEdits = (statement: ts.Statement, fileContext: FileContext, scan: DeclarationScan, shadowedNames: Set<string>): void => {
  const { compiler: tsc, sourceFile } = fileContext;
  const isImport = tsc.isImportDeclaration(statement);
  const isExport = tsc.isExportDeclaration(statement);
  if (!isImport && !isExport) {
    return;
  }
  const moduleSpecifier = statement.moduleSpecifier;
  const newModuleSpecifier = moduleSpecifier && tsc.isStringLiteral(moduleSpecifier) && MODULE_SPECIFIER_REWRITES[moduleSpecifier.text];
  if (!newModuleSpecifier) {
    return;
  }

  // `export * from '<old module>'` (and `export * as ns from`) re-exports the module's symbols
  // as the file's own public API. Rewriting the specifier would silently rename those public
  // symbols, so the statement is left whole (it fails loudly against v21) and warned about.
  if (isExport && (!statement.exportClause || tsc.isNamespaceExport(statement.exportClause))) {
    scan.starExportPositions.push(statement.getStart(sourceFile));
    return;
  }

  // Rewrite the module specifier text, preserving the surrounding quotes.
  scan.edits.push({
    start: moduleSpecifier.getStart(sourceFile) + 1,
    end: moduleSpecifier.getEnd() - 1,
    replacement: newModuleSpecifier,
  });

  const namedBindings = isImport ? statement.importClause?.namedBindings : statement.exportClause;
  if (namedBindings && tsc.isNamespaceImport(namedBindings)) {
    if (shadowedNames.has(namedBindings.name.text)) {
      scan.shadowedImports.push({ position: namedBindings.getStart(sourceFile), name: namedBindings.name.text });
    } else {
      scan.namespaceBindings.add(namedBindings.name.text);
    }
    return;
  }
  if (namedBindings && (tsc.isNamedImports(namedBindings) || tsc.isNamedExports(namedBindings))) {
    for (const element of namedBindings.elements) {
      collectSpecifierEdit(element, statement, fileContext, scan, shadowedNames);
    }
  }
};

/**
 * Rename a renamed symbol inside one named import/export specifier, and, for an un-aliased import,
 * record its local binding so pass 2 rewrites that binding's usages. getVertexAI specifiers are only
 * recorded here, and their edits depend on how the binding is used.
 *
 * @param element the `{ x }` or `{ x as y }` specifier.
 * @param statement the import/export declaration the specifier belongs to.
 * @param fileContext the compiler and parsed source file (for token offsets).
 * @param scan accumulator mutated in place.
 * @param shadowedNames tracked local names a local declaration shadows.
 */
const collectSpecifierEdit = (
  element: ts.ImportSpecifier | ts.ExportSpecifier,
  statement: ts.Statement,
  fileContext: FileContext,
  scan: DeclarationScan,
  shadowedNames: Set<string>,
): void => {
  const { compiler: tsc, sourceFile } = fileContext;
  const importedNameNode = element.propertyName ?? element.name;
  // A shadowed local name makes the usage pass unsafe for this binding: exclude it whole.
  if (tsc.isImportSpecifier(element) && shadowedNames.has(element.name.text)) {
    scan.shadowedImports.push({ position: element.getStart(sourceFile), name: element.name.text });
    return;
  }
  if (importedNameNode.text === GET_VERTEX_AI) {
    if (tsc.isImportSpecifier(element) && tsc.isImportDeclaration(statement)) {
      scan.vertexImports.push({ element, statement, localName: element.name.text });
    } else if (tsc.isExportSpecifier(element)) {
      scan.vertexExportSpecifiers.push(element);
    }
    return;
  }
  // A removed symbol has no drop-in successor: leave it (loud break) and warn with guidance.
  if (REMOVED_SYMBOL_GUIDANCE[importedNameNode.text] !== undefined) {
    scan.removedSymbols.push({ position: importedNameNode.getStart(sourceFile), name: importedNameNode.text });
    return;
  }
  const newName = SYMBOL_RENAMES[importedNameNode.text];
  if (!newName) {
    return;
  }
  // An un-aliased `export { VertexAI } from '...'` names the file's OWN public export: rename only
  // the target and keep the public name via an alias, mirroring the bare local re-export case in
  // identifierUsageEdit. `export { VertexAI as Foo } from '...'` already keeps its public name.
  const keepPublicName = tsc.isExportSpecifier(element) && !element.propertyName;
  scan.edits.push({
    start: importedNameNode.getStart(sourceFile),
    end: importedNameNode.getEnd(),
    replacement: keepPublicName ? `${newName} as ${importedNameNode.text}` : newName,
  });
  scan.editedSpecifierTokenStarts.add(importedNameNode.getStart(sourceFile));
  if (tsc.isImportSpecifier(element) && !element.propertyName) {
    scan.renamedLocalBindings.set(element.name.text, newName);
  }
};

/**
 * Pass 2: walk the whole tree, rewrite usages of the bindings found in pass 1 (renamed local
 * identifiers and `ns.oldSymbol` member accesses), and classify every getVertexAI reference.
 *
 * @param fileContext the compiler and parsed source file.
 * @param scan the pass-1 result, whose `edits` is extended in place.
 * @param vertexBindings local names bound to getVertexAI by a named import.
 * @param vertex classification accumulator mutated in place.
 */
export const collectUsageEdits = (
  fileContext: FileContext,
  scan: DeclarationScan,
  vertexBindings: Map<string, VertexImport>,
  vertex: VertexClassification,
): void => {
  const { compiler: tsc, sourceFile } = fileContext;
  // The binding groups pass 2 edits by name. A getVertexAI options literal containing an actual
  // edit site cannot be replaced as a single span (the inner edit would overlap), so
  // classification rejects those calls (see containsEditSite).
  const editableBindings: EditableBindings = {
    renamedNames: new Set<string>(scan.renamedLocalBindings.keys()),
    namespaceNames: scan.namespaceBindings,
    vertexNames: new Set<string>(vertexBindings.keys()),
  };
  forEachNodeDeep(tsc, sourceFile, node => {
    const namespaceEdit = namespaceMemberEdit(node, scan.namespaceBindings, fileContext);
    if (namespaceEdit) {
      scan.edits.push(namespaceEdit);
    }
    const removedNamespaceMember = namespaceRemovedSymbol(node, scan.namespaceBindings, fileContext);
    if (removedNamespaceMember) {
      scan.removedSymbols.push(removedNamespaceMember);
    }
    classifyNamespaceVertexAccess(node, scan.namespaceBindings, fileContext, vertex, editableBindings);
    if (tsc.isIdentifier(node)) {
      classifyVertexIdentifier(node, vertexBindings, fileContext, vertex, editableBindings);
      const usageEdit = identifierUsageEdit(node, scan, fileContext);
      if (usageEdit) {
        scan.edits.push(usageEdit);
      }
    }
  });
};

/**
 * A `ns.<removed symbol>` access, in value or type position. No rename exists for it, so the
 * site is left as is (a loud break against the new entry point) and warned with guidance.
 */
const namespaceRemovedSymbol = (node: ts.Node, namespaceBindings: Set<string>, fileContext: FileContext): RemovedSymbol | undefined => {
  const { compiler: tsc, sourceFile } = fileContext;
  if (
    tsc.isPropertyAccessExpression(node) &&
    tsc.isIdentifier(node.expression) &&
    namespaceBindings.has(node.expression.text) &&
    REMOVED_SYMBOL_GUIDANCE[node.name.text] !== undefined
  ) {
    return { position: node.name.getStart(sourceFile), name: node.name.text };
  }
  if (
    tsc.isQualifiedName(node) &&
    tsc.isIdentifier(node.left) &&
    namespaceBindings.has(node.left.text) &&
    REMOVED_SYMBOL_GUIDANCE[node.right.text] !== undefined
  ) {
    return { position: node.right.getStart(sourceFile), name: node.right.text };
  }
  return undefined;
};

/**
 * Classify a `ns.getVertexAI` member access: a direct call gets the backend-preserving rewrite,
 * anything else is left in place and logged.
 */
const classifyNamespaceVertexAccess = (
  node: ts.Node,
  namespaceBindings: Set<string>,
  fileContext: FileContext,
  vertex: VertexClassification,
  editableBindings: EditableBindings,
): void => {
  const { compiler: tsc, sourceFile } = fileContext;
  if (
    !tsc.isPropertyAccessExpression(node) ||
    !tsc.isIdentifier(node.expression) ||
    !namespaceBindings.has(node.expression.text) ||
    node.name.text !== GET_VERTEX_AI
  ) {
    return;
  }
  const parent = node.parent;
  if (tsc.isCallExpression(parent) && parent.expression === node) {
    classifyVertexCall(parent, { namespaceAccess: node }, fileContext, vertex, 'namespace', editableBindings);
    return;
  }
  vertex.unsupported.push({
    position: node.getStart(sourceFile),
    reason: `a use of ${node.expression.text}.getVertexAI that is not a direct call`,
    origin: 'namespace',
  });
};

/**
 * Classify one identifier reference to a named getVertexAI import: look-alikes are ignored, a
 * direct call gets the backend-preserving rewrite, and any other value reference is left in
 * place and logged.
 */
const classifyVertexIdentifier = (
  node: ts.Identifier,
  vertexBindings: Map<string, VertexImport>,
  fileContext: FileContext,
  vertex: VertexClassification,
  editableBindings: EditableBindings,
): void => {
  const { compiler: tsc, sourceFile } = fileContext;
  const binding = vertexBindings.get(node.text);
  if (!binding || isNonUsageReference(fileContext, node)) {
    return;
  }
  const parent = node.parent;
  // A direct call is the one rewritable shape.
  if (tsc.isCallExpression(parent) && parent.expression === node) {
    classifyVertexCall(parent, { binding }, fileContext, vertex, 'binding', editableBindings);
    return;
  }
  // Everything else hands the function itself around, where a rename would change backends.
  vertex.unsupported.push({
    position: node.getStart(sourceFile),
    reason: tsc.isExportSpecifier(parent)
      ? 'a re-export of getVertexAI (rewriting it to getAI would silently change its callers\' backend)'
      : 'a use of getVertexAI that is not a direct call (only direct calls can be rewritten safely)',
    origin: 'binding',
  });
};

/**
 * Whether pass 2 would actually edit this identifier. Mirrors the passes' own position rules:
 * look-alikes (member-access names, property keys, declared names) are never edited, a renamed
 * or getVertexAI binding in a value position is, and a namespace name matters only as the left
 * side of a member access whose member gets renamed or rewritten.
 */
const producesEdit = (node: ts.Identifier, fileContext: FileContext, editableBindings: EditableBindings): boolean => {
  const { compiler: tsc } = fileContext;
  if (isNonUsageReference(fileContext, node)) {
    return false;
  }
  if (editableBindings.renamedNames.has(node.text) || editableBindings.vertexNames.has(node.text)) {
    return true;
  }
  if (!editableBindings.namespaceNames.has(node.text)) {
    return false;
  }
  const parent = node.parent;
  if (tsc.isPropertyAccessExpression(parent) && parent.expression === node) {
    return SYMBOL_RENAMES[parent.name.text] !== undefined || parent.name.text === GET_VERTEX_AI;
  }
  if (tsc.isQualifiedName(parent) && parent.left === node) {
    return SYMBOL_RENAMES[parent.right.text] !== undefined;
  }
  return false;
};

/**
 * Whether a subtree contains an identifier that pass 2 would also rewrite.
 */
const containsEditSite = (root: ts.Node, fileContext: FileContext, editableBindings: EditableBindings): boolean => {
  const { compiler: tsc } = fileContext;
  let found = false;
  forEachNodeDeep(tsc, root, node => {
    if (found) {
      return false;
    }
    if (tsc.isIdentifier(node) && producesEdit(node, fileContext, editableBindings)) {
      found = true;
      return false;
    }
  });
  return found;
};

/**
 * Whether an options argument is a literal the rewrite understands: an empty object literal, or
 * one whose only property is `location` (in either assignment or shorthand form).
 */
const classifyOptionsArgument = (optionsArgument: ts.Expression, fileContext: FileContext, editableBindings: EditableBindings): OptionsClassification => {
  const { compiler: tsc, sourceFile } = fileContext;
  if (!tsc.isObjectLiteralExpression(optionsArgument)) {
    return { supported: false };
  }
  // The options literal is replaced as ONE span, so an edit site inside it would produce
  // overlapping edits. Such calls are left for manual migration.
  if (containsEditSite(optionsArgument, fileContext, editableBindings)) {
    return { supported: false, conflicting: true };
  }
  if (optionsArgument.properties.length === 0) {
    return { supported: true };
  }
  const soleProperty = optionsArgument.properties.length === 1 ? optionsArgument.properties[0] : undefined;
  if (
    soleProperty &&
    tsc.isPropertyAssignment(soleProperty) &&
    tsc.isIdentifier(soleProperty.name) &&
    soleProperty.name.text === 'location'
  ) {
    return { supported: true, locationText: soleProperty.initializer.getText(sourceFile) };
  }
  if (soleProperty && tsc.isShorthandPropertyAssignment(soleProperty) && soleProperty.name.text === 'location') {
    return { supported: true, locationText: 'location' };
  }
  return { supported: false };
};

/**
 * Decide whether one getVertexAI call's argument shape can be rewritten to
 * `getAI(app, { backend: new VertexAIBackend(location?) })` without guessing.
 *
 * Supported shapes: no arguments, an app argument alone, and an app argument plus an object
 * literal whose only property is `location` (or an empty literal). Anything else (a spread, a
 * variable holding the options, extra option keys) is left in place and logged.
 */
const classifyVertexCall = (
  call: ts.CallExpression,
  target: Pick<SupportedVertexCall, 'binding' | 'namespaceAccess'>,
  fileContext: FileContext,
  vertex: VertexClassification,
  origin: 'binding' | 'namespace',
  editableBindings: EditableBindings,
): void => {
  const { compiler: tsc, sourceFile } = fileContext;
  const callArguments = call.arguments;
  const hasSpread = callArguments.some(tsc.isSpreadElement);
  // Zero arguments or a lone app argument: nothing needs translating.
  if (callArguments.length <= 1 && !hasSpread) {
    vertex.supportedCalls.push({ call, ...target });
    return;
  }
  // An app argument plus a literal options object: the location moves into the backend.
  let conflicting = false;
  if (callArguments.length === 2 && !hasSpread) {
    const options = classifyOptionsArgument(callArguments[1], fileContext, editableBindings);
    if (options.supported) {
      vertex.supportedCalls.push({ call, ...target, locationText: options.locationText });
      return;
    }
    conflicting = options.conflicting === true;
  }
  vertex.unsupported.push({
    position: call.getStart(sourceFile),
    reason: conflicting
      ? 'a getVertexAI call whose options mention other symbols this migration rewrites (replacing both at once would conflict)'
      : 'a getVertexAI call whose arguments do not map onto getAI safely (only an optional app argument plus an optional literal `{ location }` object are rewritten)',
    origin,
  });
};

/**
 * Build the edit for a namespaced `ns.oldSymbol` access, in value position (a PropertyAccessExpression
 * like `ns.provideVertexAI(...)`) or type position (a QualifiedName like `let x: ns.VertexAI`).
 *
 * @returns the edit, or undefined when the node is not a renamable namespace access.
 */
const namespaceMemberEdit = (node: ts.Node, namespaceBindings: Set<string>, fileContext: FileContext): TextEdit | undefined => {
  const { compiler: tsc, sourceFile } = fileContext;
  if (
    tsc.isPropertyAccessExpression(node) &&
    tsc.isIdentifier(node.expression) &&
    namespaceBindings.has(node.expression.text) &&
    SYMBOL_RENAMES[node.name.text]
  ) {
    return { start: node.name.getStart(sourceFile), end: node.name.getEnd(), replacement: SYMBOL_RENAMES[node.name.text] };
  }
  if (
    tsc.isQualifiedName(node) &&
    tsc.isIdentifier(node.left) &&
    namespaceBindings.has(node.left.text) &&
    SYMBOL_RENAMES[node.right.text]
  ) {
    return { start: node.right.getStart(sourceFile), end: node.right.getEnd(), replacement: SYMBOL_RENAMES[node.right.text] };
  }
  return undefined;
};

/**
 * Build the edit for an identifier that references an un-aliased renamed import. Returns undefined
 * for look-alikes that are not references to the import.
 *
 * @returns the edit, or undefined when the identifier should be left as is.
 */
const identifierUsageEdit = (node: ts.Identifier, scan: DeclarationScan, fileContext: FileContext): TextEdit | undefined => {
  const { compiler: tsc, sourceFile } = fileContext;
  const replacement = scan.renamedLocalBindings.get(node.text);
  if (replacement === undefined) {
    return undefined;
  }
  const start = node.getStart(sourceFile);
  // Already renamed in pass 1, or not a reference to the import at all.
  if (scan.editedSpecifierTokenStarts.has(start) || isNonUsageReference(fileContext, node)) {
    return undefined;
  }
  const parent = node.parent;
  // A bare local re-export `export { VertexAI }` (no `from`) is a usage of the renamed local
  // binding. Preserve the external export name by expanding to `export { AI as VertexAI }`. An
  // `export { x } from '...'` specifier is instead handled in pass 1.
  if (tsc.isExportSpecifier(parent) && parent.name === node && !parent.propertyName) {
    const exportDeclaration = parent.parent.parent;
    if (tsc.isExportDeclaration(exportDeclaration) && !exportDeclaration.moduleSpecifier) {
      return { start, end: node.getEnd(), replacement: `${replacement} as ${node.text}` };
    }
    return undefined;
  }
  // `{ provideVertexAI }` is shorthand for `{ provideVertexAI: provideVertexAI }`. Only the value
  // changed, so expand it rather than rename the key.
  if (tsc.isShorthandPropertyAssignment(parent) && parent.name === node) {
    return { start: node.getEnd(), end: node.getEnd(), replacement: `: ${replacement}` };
  }
  return { start, end: node.getEnd(), replacement };
};

/**
 * Whether an identifier is not a reference to an imported binding at all: the import specifier
 * itself (handled in pass 1), a destructuring key or shorthand binding target (they read a
 * property, not the import, while a binding initializer like `{ cb = getVertexAI }` is a real
 * usage), or a member-access or declared-property name (see isMemberOrDeclaredName).
 */
const isNonUsageReference = (fileContext: FileContext, node: ts.Identifier): boolean => {
  const { compiler: tsc } = fileContext;
  const parent = node.parent;
  if (tsc.isImportSpecifier(parent) && (parent.propertyName === node || parent.name === node)) {
    return true;
  }
  if (tsc.isBindingElement(parent) && (parent.propertyName === node || (parent.name === node && !parent.propertyName))) {
    return true;
  }
  return isMemberOrDeclaredName(fileContext, node, parent);
};

/**
 * Whether an identifier is a member-access name (`obj.getVertexAI`) or a declared
 * property/accessor/enum-member name rather than a value reference to the import.
 */
const isMemberOrDeclaredName = (fileContext: FileContext, node: ts.Identifier, parent: ts.Node): boolean => {
  const { compiler: tsc } = fileContext;
  const isMemberName =
    (tsc.isPropertyAccessExpression(parent) && parent.name === node) ||
    (tsc.isQualifiedName(parent) && parent.right === node);
  const isDeclaredPropertyName =
    (tsc.isPropertyAssignment(parent) ||
      tsc.isPropertyDeclaration(parent) ||
      tsc.isPropertySignature(parent) ||
      tsc.isMethodDeclaration(parent) ||
      tsc.isGetAccessorDeclaration(parent) ||
      tsc.isSetAccessorDeclaration(parent) ||
      tsc.isEnumMember(parent)) &&
    parent.name === node;
  return isMemberName || isDeclaredPropertyName;
};
