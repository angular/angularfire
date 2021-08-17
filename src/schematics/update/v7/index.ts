import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { overwriteIfExists, safeReadJSON, stringifyFormatted } from '../../ng-add-common';
import { default as defaultDependencies, firebaseFunctions } from '../../versions.json';

const FIREBASE_IMPORT_REGEX = /(?<key>import|export)\s+(?:(?<alias>[\w,{}\s\*]+)\s+from)?\s*(?:(["'])?firebase\/(?<ref>[@\w\s\\\/.-]+)\3?)\s*;/g;
const AT_FIREBASE_IMPORT_REGEX = /(?<key>import|export)\s+(?:(?<alias>[\w,{}\s\*]+)\s+from)?\s*(?:(["'])?@firebase\/(?<ref>[@\w\s\\\/.-]+)\3?)\s*;/g;
const ANGULAR_FIRE_IMPORT_REGEX = /(?<key>import|export)\s+(?:(?<alias>[\w,{}\s\*]+)\s+from)?\s*(?:(["'])?@angular\/fire\/(?<ref>[@\w\s\\\/.-]+)\3?)\s*;/g;

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
        let didChangeContent = false;
        if (content.match(FIREBASE_IMPORT_REGEX)) {
            content.replace(FIREBASE_IMPORT_REGEX, '$1 $2 from $3firebase/compat/$4$3;');
            didChangeContent = true;
        }
        if (content.match(AT_FIREBASE_IMPORT_REGEX)) {
            content.replace(AT_FIREBASE_IMPORT_REGEX, '$1 $2 from $3@firebase/compat/$4$3;');
            didChangeContent = true;
        }
        if (content.match(ANGULAR_FIRE_IMPORT_REGEX)) {
            content.replace(ANGULAR_FIRE_IMPORT_REGEX, '$1 $2 from $3@angular/fire/compat/$4$3;');
            didChangeContent = true;
        }
        if (didChangeContent) {
            host.overwrite(filePath, content);
        }
    });

    return host;
};
