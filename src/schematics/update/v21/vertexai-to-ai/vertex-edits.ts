// Builders for the getVertexAI edits: the backend-preserving call rewrite, the import
// specifier rename/repurpose/removal, and the VertexAIBackend import, with file-wide
// dedup so no binding is ever injected twice.

import type * as ts from 'typescript';
import { BACKEND_CLASS, GET_AI, GET_VERTEX_AI } from './tables.js';
import type { DeclarationScan, FileContext, ShadowedImport, SupportedVertexCall, TextEdit, VertexClassification, VertexEdits, VertexImport } from './types.js';

/**
 * Turn the classified getVertexAI references into edits: rewritten calls, the import specifier
 * rename/replacement/removal, and the VertexAIBackend import. Every named-binding edit in the
 * file is skipped, so the binding stays coherent (the old import then fails to compile loudly,
 * and the log says why), when either a named-binding reference was unsupported or the file binds
 * getAI / VertexAIBackend from a non AI Logic source that the injected references would hit.
 *
 * @returns the getVertexAI edits plus the rewritten and skipped call positions for the log.
 */
export const buildVertexEdits = (
  fileContext: FileContext,
  scan: DeclarationScan,
  vertex: VertexClassification,
  injectionConflicts: ShadowedImport[],
): VertexEdits => {
  const { sourceFile } = fileContext;
  const edits: TextEdit[] = [];
  const callPositions: number[] = [];
  const blockedCallPositions: number[] = [];
  const injectionBlocked = injectionConflicts.length > 0 && scan.vertexImports.length > 0;
  const bindingBlocked = vertex.unsupported.some(usage => usage.origin === 'binding') || injectionBlocked;

  const statementsNeedingBackend = new Set<ts.ImportDeclaration>();
  for (const supported of vertex.supportedCalls) {
    // A blocked file skips its named-binding calls, recording each for the log.
    if (supported.binding && bindingBlocked) {
      blockedCallPositions.push(supported.call.getStart(sourceFile));
      continue;
    }
    // Namespace calls reach the backend as `ns.VertexAIBackend`, named imports as a bare name.
    const backendReference = supported.namespaceAccess
      ? `${supported.namespaceAccess.expression.getText(sourceFile)}.${BACKEND_CLASS}`
      : BACKEND_CLASS;
    // Rename an un-aliased callee to getAI. An aliased local keeps its name.
    if (supported.binding) {
      statementsNeedingBackend.add(supported.binding.statement);
      if (supported.binding.localName === GET_VERTEX_AI) {
        const callee = supported.call.expression;
        edits.push({ start: callee.getStart(sourceFile), end: callee.getEnd(), replacement: GET_AI });
      }
    }
    // Rename `ns.getVertexAI` to `ns.getAI`.
    if (supported.namespaceAccess) {
      const nameNode = supported.namespaceAccess.name;
      edits.push({ start: nameNode.getStart(sourceFile), end: nameNode.getEnd(), replacement: GET_AI });
    }
    // Pin the call's arguments to the Vertex AI backend.
    edits.push(...vertexArgumentEdits(supported, fileContext, backendReference));
    callPositions.push(supported.call.getStart(sourceFile));
  }

  if (!bindingBlocked) {
    // Local-name checks are FILE-wide and the backend import is added at most once, so two
    // getVertexAI specifiers (or two old-module statements) cannot inject duplicate bindings.
    const importedLocals = importedLocalNames(fileContext);
    let backendProvided = importedLocals.has(BACKEND_CLASS);
    for (const vertexImport of scan.vertexImports) {
      const addBackend = statementsNeedingBackend.has(vertexImport.statement) && !backendProvided;
      edits.push(...vertexSpecifierEdits(vertexImport, addBackend, importedLocals.has(GET_AI), fileContext));
      if (addBackend) {
        backendProvided = true;
      }
    }
  }
  return { edits, callPositions, blockedCallPositions, injectionBlocked };
};

/** Every local name bound by any import declaration in the file (default, namespace, and named). */
const importedLocalNames = (fileContext: FileContext): Set<string> => {
  const { compiler: tsc, sourceFile } = fileContext;
  const names = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!tsc.isImportDeclaration(statement) || !statement.importClause) {
      continue;
    }
    if (statement.importClause.name) {
      names.add(statement.importClause.name.text);
    }
    const namedBindings = statement.importClause.namedBindings;
    if (!namedBindings) {
      continue;
    }
    if (tsc.isNamespaceImport(namedBindings)) {
      names.add(namedBindings.name.text);
    } else {
      for (const element of namedBindings.elements) {
        names.add(element.name.text);
      }
    }
  }
  return names;
};

/**
 * Build the argument edits that pin one rewritten call to the Vertex AI backend.
 */
const vertexArgumentEdits = (supported: SupportedVertexCall, fileContext: FileContext, backendReference: string): TextEdit[] => {
  const { sourceFile } = fileContext;
  const backendObject = `{ backend: new ${backendReference}(${supported.locationText ?? ''}) }`;
  const callArguments = supported.call.arguments;
  if (callArguments.length === 0) {
    // getAI's app parameter is optional but positional, so the options need an explicit undefined.
    return [{ start: supported.call.getEnd() - 1, end: supported.call.getEnd() - 1, replacement: `undefined, ${backendObject}` }];
  }
  if (callArguments.length === 1) {
    const appArgument = callArguments[0];
    return [{ start: appArgument.getEnd(), end: appArgument.getEnd(), replacement: `, ${backendObject}` }];
  }
  const optionsArgument = callArguments[1];
  return [{ start: optionsArgument.getStart(sourceFile), end: optionsArgument.getEnd(), replacement: backendObject }];
};

/**
 * Build the import-specifier edits for one named getVertexAI import: rename it to getAI, or, when
 * the file already binds a local getAI, remove or repurpose it, and add the VertexAIBackend import
 * when the caller says a rewritten call needs it (at most once per file).
 */
const vertexSpecifierEdits = (vertexImport: VertexImport, addBackend: boolean, fileHasGetAILocal: boolean, fileContext: FileContext): TextEdit[] => {
  const { compiler: tsc, sourceFile } = fileContext;
  const edits: TextEdit[] = [];
  const namedBindings = vertexImport.statement.importClause?.namedBindings;
  if (!namedBindings || !tsc.isNamedImports(namedBindings)) {
    return edits;
  }
  const elements = namedBindings.elements;
  const element = vertexImport.element;
  const importedNameNode = element.propertyName ?? element.name;

  // A local getAI already exists (this statement or another import): renaming would bind getAI
  // twice, so the specifier is repurposed or removed instead.
  if (!element.propertyName && fileHasGetAILocal) {
    // Repurpose it for the backend import.
    if (addBackend) {
      return [{ start: element.getStart(sourceFile), end: element.getEnd(), replacement: BACKEND_CLASS }];
    }
    // The only specifier: leave an empty named import behind.
    if (elements.length === 1) {
      return [{ start: element.getStart(sourceFile), end: element.getEnd(), replacement: '' }];
    }
    // Remove the specifier together with the comma between it and its neighbor.
    const index = elements.indexOf(element);
    return index > 0
      ? [{ start: elements[index - 1].getEnd(), end: element.getEnd(), replacement: '' }]
      : [{ start: element.getStart(sourceFile), end: elements[1].getStart(sourceFile), replacement: '' }];
  }

  // Rename getVertexAI to getAI (on the imported name, so an alias keeps its local name), and
  // append the backend import when a rewritten call needs it.
  edits.push({ start: importedNameNode.getStart(sourceFile), end: importedNameNode.getEnd(), replacement: GET_AI });
  if (addBackend) {
    edits.push({ start: element.getEnd(), end: element.getEnd(), replacement: `, ${BACKEND_CLASS}` });
  }
  return edits;
};
