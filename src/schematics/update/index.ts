import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export const ngPostUpdate = (): Rule => (
    host: Tree,
    context: SchematicContext
) => {
    return host;
};
