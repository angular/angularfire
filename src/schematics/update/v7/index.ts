import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { overwriteIfExists, safeReadJSON, stringifyFormatted } from '../../common';
import { peerDependencies, firebaseFunctionsDependencies } from '../../versions.json';
import { join } from 'path';

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

    Object.keys(peerDependencies).forEach(depName => {
        const dep = peerDependencies[depName];
        if (dep) {
            packageJson[dep.dev ? 'devDependencies' : 'dependencies'][depName] = dep.version;
        }
    });

    // TODO test if it's a SSR project in the JSON
    Object.keys(firebaseFunctionsDependencies).forEach(depName => {
        const dep = firebaseFunctionsDependencies[depName];
        if (dep.dev && packageJson.devDependencies[depName]) {
            packageJson.devDependencies[depName] = dep.version;
        } else if (packageJson.dependencies[depName]) {
            packageJson.dependencies[depName] = dep.version;
        }
    });

    overwriteIfExists(host, 'package.json', stringifyFormatted(packageJson));
    context.addTask(new NodePackageInstallTask());

    const angularJson = host.exists('angular.json') && safeReadJSON('angular.json', host);
    if (packageJson === undefined) {
        throw new SchematicsException('Could not locate angular.json');
    }

    // TODO investigate if this is correct in Windows
    const srcRoots: string[] = Object.values(angularJson.projects).map((it: any) =>
        join(...['/', it.root, it.sourceRoot].filter(it => !!it))
    );

    host.visit(filePath => {
        if (
            !filePath.endsWith('.ts') ||
            filePath.endsWith('.d.ts') ||
            !srcRoots.find(root => filePath.startsWith(root))
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
            overwriteIfExists(host, filePath, newContent);
        }
    });

    return host;
};
