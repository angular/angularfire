// The analyses that decide when rewriting is NOT safe: local declarations that shadow a
// tracked import name, and bindings of the injected names (getAI, VertexAIBackend) that come
// from somewhere other than AI Logic. Both matter because the passes match identifiers by
// text without scope analysis, and the design rule is to leave code whole and warn rather
// than ever change behavior silently.

import type * as ts from 'typescript';
import { forEachNodeDeep } from './ast-walk.js';
import { AI_MODULE_SPECIFIERS, BACKEND_CLASS, GET_AI, GET_VERTEX_AI, MODULE_SPECIFIER_REWRITES, SYMBOL_RENAMES } from './tables.js';
import type { FileContext, ShadowedImport } from './types.js';

/**
 * The import/export statements that reference an old Vertex AI entry point.
 */
const oldModuleStatementsOf = (fileContext: FileContext): Set<ts.Node> => {
  const { compiler: tsc, sourceFile } = fileContext;
  const statements = new Set<ts.Node>();
  for (const statement of sourceFile.statements) {
    if (
      (tsc.isImportDeclaration(statement) || tsc.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      tsc.isStringLiteral(statement.moduleSpecifier) &&
      MODULE_SPECIFIER_REWRITES[statement.moduleSpecifier.text]
    ) {
      statements.add(statement);
    }
  }
  return statements;
};

/**
 * The local names bound by the old-module imports whose usages the passes rewrite BY NAME:
 * un-aliased renamed imports, every getVertexAI import (aliased or not, its calls are rewritten),
 * and namespace imports. Aliased renames are absent: their usages are never edited.
 */
const collectTrackedLocalNames = (fileContext: FileContext, oldModuleStatements: Set<ts.Node>): Set<string> => {
  const { compiler: tsc } = fileContext;
  const names = new Set<string>();
  for (const statement of oldModuleStatements) {
    if (!tsc.isImportDeclaration(statement)) {
      continue;
    }
    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings) {
      continue;
    }
    if (tsc.isNamespaceImport(namedBindings)) {
      names.add(namedBindings.name.text);
      continue;
    }
    for (const element of namedBindings.elements) {
      const importedName = (element.propertyName ?? element.name).text;
      if (importedName === GET_VERTEX_AI || (SYMBOL_RENAMES[importedName] && !element.propertyName)) {
        names.add(element.name.text);
      }
    }
  }
  return names;
};

/**
 * The local name a node declares, for shadow detection. Lexical declarations only: class members
 * and object properties do not shadow imports.
 */
const declaredName = (fileContext: FileContext, node: ts.Node): string | undefined => {
  const { compiler: tsc } = fileContext;
  if ((tsc.isVariableDeclaration(node) || tsc.isParameter(node) || tsc.isBindingElement(node)) && tsc.isIdentifier(node.name)) {
    return node.name.text;
  }
  if (
    (tsc.isFunctionDeclaration(node) ||
      tsc.isFunctionExpression(node) ||
      tsc.isClassDeclaration(node) ||
      tsc.isClassExpression(node) ||
      tsc.isInterfaceDeclaration(node) ||
      tsc.isTypeAliasDeclaration(node) ||
      tsc.isEnumDeclaration(node)) &&
    node.name
  ) {
    return node.name.text;
  }
  if (tsc.isTypeParameterDeclaration(node)) {
    return node.name.text;
  }
  if (tsc.isImportSpecifier(node) || tsc.isNamespaceImport(node)) {
    return node.name.text;
  }
  if (tsc.isImportClause(node) && node.name) {
    return node.name.text;
  }
  return undefined;
};

/**
 * Whether an import binding is the AI Logic module's own export under its own name, making it
 * safe for rewritten getVertexAI calls to reuse. Anything else bound to an injected name (an
 * aliased or default import, a namespace import, or an import from an unrelated module) is a
 * conflict.
 */
const isReusableAIImport = (fileContext: FileContext, node: ts.Node): boolean => {
  const { compiler: tsc } = fileContext;
  if (!tsc.isImportSpecifier(node) || node.propertyName) {
    return false;
  }
  let current: ts.Node | undefined = node;
  while (current && !tsc.isImportDeclaration(current)) {
    current = current.parent;
  }
  if (!current || !tsc.isImportDeclaration(current)) {
    return false;
  }
  return tsc.isStringLiteral(current.moduleSpecifier) && AI_MODULE_SPECIFIERS.has(current.moduleSpecifier.text);
};

/**
 * Which tracked names are also declared locally somewhere outside the old-module imports. The
 * usage passes match identifiers by text without scope analysis, so any such name is unsafe to
 * rewrite (a shadowed local usage would be redirected to the import) and gets excluded instead.
 */
export const collectShadowedNames = (fileContext: FileContext): Set<string> => {
  const { compiler: tsc, sourceFile } = fileContext;
  const oldModuleStatements = oldModuleStatementsOf(fileContext);
  const trackedNames = collectTrackedLocalNames(fileContext, oldModuleStatements);
  const shadowed = new Set<string>();
  if (trackedNames.size === 0) {
    return shadowed;
  }
  forEachNodeDeep(tsc, sourceFile, node => {
    if (oldModuleStatements.has(node)) {
      return false;
    }
    const declared = declaredName(fileContext, node);
    if (declared && trackedNames.has(declared)) {
      shadowed.add(declared);
    }
  });
  return shadowed;
};

/**
 * Bindings of getAI or VertexAIBackend that do NOT come from an AI Logic module: a lexical
 * declaration, or any other import shape. The rewrite injects references to these names, so a
 * foreign binding would capture the rewritten calls or collide with the injected import. The
 * file's getVertexAI imports are left unmigrated instead.
 */
export const collectInjectionConflicts = (fileContext: FileContext): ShadowedImport[] => {
  const { compiler: tsc, sourceFile } = fileContext;
  const conflicts: ShadowedImport[] = [];
  forEachNodeDeep(tsc, sourceFile, node => {
    const declared = declaredName(fileContext, node);
    if ((declared === GET_AI || declared === BACKEND_CLASS) && !isReusableAIImport(fileContext, node)) {
      conflicts.push({ position: node.getStart(sourceFile), name: declared });
    }
  });
  return conflicts;
};
