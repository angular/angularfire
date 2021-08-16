import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { overwriteIfExists, safeReadJSON, stringifyFormatted } from '../../ng-add-common';
import { default as defaultDependencies, firebaseFunctions } from '../../versions.json';

export const ngUpdate = (): Rule => (
    host: Tree,
    context: SchematicContext
) => {
    const packageJson = host.exists('package.json') && safeReadJSON('package.json', host);

    if (packageJson === undefined) {
        throw new SchematicsException('Could not locate package.json');
    }

    Object.keys(defaultDependencies).forEach(depName => {
        const dep = defaultDependencies[depName];
        if (dep.dev) {
            packageJson.devDependencies[depName] = dep.version;
        } else {
            packageJson.dependencies[depName] = dep.version;
        }
    });

    // TODO test if it's a SSR project in the JSON
    Object.keys(firebaseFunctions).forEach(depName => {
        const dep = firebaseFunctions[depName];
        if (dep.dev && packageJson.devDependencies[depName]) {
            packageJson.devDependencies[depName] = dep.version;
        } else if (packageJson.dependencies[depName]) {
            packageJson.dependencies[depName] = dep.version;
        }
    });

    overwriteIfExists(host, 'package.json', stringifyFormatted(packageJson));

    host.visit(filePath => {
        if (
            !filePath.endsWith('.ts') ||
            filePath.endsWith('.d.ts') ||
            filePath.startsWith('/node_modules')
        ) {
            return;
        }
        const content = host.read(filePath)?.toString();
        if (!content) {
            return;
        }
        // TODO clean this up, skip overwrite if uneeded
        content.replace(/(?<key>import|export)\s+(?:(?<alias>[\w,{}\s\*]+)\s+from)?\s*(?:(["'])?firebase\/(?<ref>[@\w\s\\\/.-]+)\3?)\s*;/, '$1 $2 from $3firebase/compat/$4$3;');
        content.replace(/(?<key>import|export)\s+(?:(?<alias>[\w,{}\s\*]+)\s+from)?\s*(?:(["'])?@firebase\/(?<ref>[@\w\s\\\/.-]+)\3?)\s*;/, '$1 $2 from $3@firebase/compat/$4$3;');
        content.replace(/(?<key>import|export)\s+(?:(?<alias>[\w,{}\s\*]+)\s+from)?\s*(?:(["'])?@angular\/fire\/(?<ref>[@\w\s\\\/.-]+)\3?)\s*;/, '$1 $2 from $3@angular/fire/compat/$4$3;');
        host.overwrite(filePath, content);
        console.log(filePath);
    });

    console.log('Called ng-update');
    return host;
};
