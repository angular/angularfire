import * as ts from 'typescript';
import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { findNode } from '../schematics-core/utility/ast-utils';
import { InsertChange } from '../schematics-core/utility/change';

/**
 * Adds a package to the package.json
 */
export function addEnvironmentEntry(
  host: Tree,
  filename: string,
  data: string,
): Tree {
  const filePath = `src/environments/${filename}`;

  if (host.exists(filePath)) {
    let sourceText = host.read(filePath)!.toString('utf-8');
    let sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);

    const envIdentifier = findNode(sourceFile as any, ts.SyntaxKind.Identifier, 'environment');
    if (!envIdentifier) {
      throw new SchematicsException(`Cannot find 'environment' identifier in ${filename}`);
    }

    const envObjectLiteral = envIdentifier.parent!.getChildren().find(({ kind }) => kind === ts.SyntaxKind.ObjectLiteralExpression)!;
    const openBracketToken = envObjectLiteral.getChildren().find(({ kind }) => kind === ts.SyntaxKind.OpenBraceToken)!;

    const recorder = host.beginUpdate(filePath);
    const change = new InsertChange(filePath, openBracketToken.end, data);
    recorder.insertLeft(change.pos, change.toAdd);
    host.commitUpdate(recorder);
  } else {
    throw new SchematicsException(`File ${filename} does not exist`);
  }

  return host;
}
