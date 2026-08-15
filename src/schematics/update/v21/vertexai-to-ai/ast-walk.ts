// A stack-based depth-first walk over a TypeScript AST. The rewrite runs on user files of
// arbitrary shape, and a recursive walk overflows the call stack on deep expressions (a few
// thousand chained operands), so every full-tree traversal in this package uses this instead.

import type * as ts from 'typescript';

/**
 * Visit root and every descendant in source order (pre-order), without recursion.
 *
 * @param visitNode return false to skip the node's children (subtree pruning).
 */
export const forEachNodeDeep = (compiler: typeof ts, root: ts.Node, visitNode: (node: ts.Node) => boolean | void): void => {
  const pending: ts.Node[] = [root];
  while (pending.length > 0) {
    const node = pending.pop();
    if (!node || visitNode(node) === false) {
      continue;
    }
    const children: ts.Node[] = [];
    compiler.forEachChild(node, child => {
      children.push(child);
    });
    for (let index = children.length - 1; index >= 0; index--) {
      pending.push(children[index]);
    }
  }
};
