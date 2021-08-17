import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { overwriteIfExists, safeReadJSON, stringifyFormatted } from '../../ng-add-common';
import { default as defaultDependencies, firebaseFunctions } from '../../versions.json';

const IMPORT_REGEX = /(?<key>import|export)\s+(?:(?<alias>[\w,{}\s\*]+)\s+from)?\s*(?:(?<quote>["'])?(?<ref>[@\w\s\\\/.-]+)\3?)\s*(?<term>[;\n])/g;
interface ImportRegexMatch {
    key: string;
    alias: string;
    ref: string;
    quote: string;
    term: string;
}

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
        const newContent = content.replace(IMPORT_REGEX, (substring, ...args) => {
            const { alias, key, ref, quote, term }: ImportRegexMatch = args.pop();
            if (ref.startsWith('@angular/fire') && !ref.startsWith('@angular/fire/compat')) {
                return `${key} ${alias} from ${quote}${ref.replace('@angular/fire', '@angular/fire/compat')}${quote}${term}`;
            }
            if (ref.startsWith('firebase') && !ref.startsWith('firebase/compat')) {
                return `${key} ${alias} from ${quote}${ref.replace('firebase', 'firebase/compat')}${quote}${term}`;
            }
            if (ref.startsWith('@firebase')) {
                return `${key} ${alias} from ${quote}${ref.replace('@firebase', 'firebase')}${quote}${term}`;
            }
            return substring;
        });
        if (content !== newContent) {
            host.overwrite(filePath, content);
        }
    });

    return host;
};
