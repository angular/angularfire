import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export const ngPostUpdate = (): Rule => (
    host: Tree,
    _context: SchematicContext
) => {
    return host;
};
