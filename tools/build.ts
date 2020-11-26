import { spawn } from 'child_process';
import { copy, readFile, writeFile } from 'fs-extra';
import { prettySize } from 'pretty-size';
import { sync as gzipSync } from 'gzip-size';
import { dirname, join } from 'path';
import { keys as tsKeys } from 'ts-transformer-keys';
import firebase from 'firebase/app';

// TODO infer these from the package.json
const MODULES = [
  'core', 'analytics', 'auth', 'auth-guard', 'database',
  'firestore', 'firestore-lazy', 'functions', 'remote-config',
  'storage', 'messaging', 'performance', 'storage-lazy',
  'database-lazy', // 'firestore/memory', 'firestore-lazy/memory',
];
const LAZY_MODULES = [['analytics'], ['auth'], ['functions'], ['firestore-lazy', 'firestore'], ['messaging'], ['remote-config'], ['storage-lazy', 'storage'], ['database-lazy', 'database']];
const UMD_NAMES = MODULES.map(m => m === 'core' ? 'angular-fire' : `angular-fire-${m}`);
const ENTRY_NAMES = MODULES.map(m => m === 'core' ? '@angular/fire' : `@angular/fire/${m}`);

function proxyPolyfillCompat() {
  const defaultObject = {
    analytics: tsKeys<firebase.analytics.Analytics>(),
    auth: tsKeys<firebase.auth.Auth>(),
    functions: tsKeys<firebase.functions.Functions>(),
    messaging: tsKeys<firebase.messaging.Messaging>(),
    performance: tsKeys<firebase.performance.Performance>(),
    'remote-config': tsKeys<firebase.remoteConfig.RemoteConfig>(),
    'firestore-lazy': tsKeys<firebase.firestore.Firestore>(),
    'storage-lazy': tsKeys<firebase.storage.Storage>(),
    'database-lazy': tsKeys<firebase.database.Database>(),
  };

  return Promise.all(Object.keys(defaultObject).map(module =>
    writeFile(`./src/${module}/base.ts`, `export const proxyPolyfillCompat = {
${defaultObject[module].map(it => `  ${it}: null,`).join('\n')}
};\n`)
  ));
}

const src = (...args: string[]) => join(process.cwd(), 'src', ...args);
const dest = (...args: string[]) => join(process.cwd(), 'dist', 'packages-dist', ...args);

const rootPackage = import(join(process.cwd(), 'package.json'));

async function replacePackageCoreVersion() {
  const root = await rootPackage;
  const replace = require('replace-in-file');
  return replace({
    files: dest('**', '*.js'),
    from: 'ANGULARFIRE2_VERSION',
    to: root.version
  });
}

async function replacePackageJsonVersions() {
  const path = dest('package.json');
  const root = await rootPackage;
  const pkg = await import(path);
  Object.keys(pkg.peerDependencies).forEach(peer => {
    pkg.peerDependencies[peer] = root.dependencies[peer];
  });
  pkg.version = root.version;
  return writeFile(path, JSON.stringify(pkg, null, 2));
}

async function replaceSchematicVersions() {
  const root = await rootPackage;
  const path = dest('schematics', 'versions.json');
  const dependencies = await import(path);
  Object.keys(dependencies.default).forEach(name => {
    dependencies.default[name].version = root.dependencies[name] || root.devDependencies[name];
  });
  Object.keys(dependencies.firebaseFunctions).forEach(name => {
    dependencies.firebaseFunctions[name].version = root.dependencies[name] || root.devDependencies[name];
  });
  return writeFile(path, JSON.stringify(dependencies, null, 2));
}

function spawnPromise(command: string, args: string[]) {
  return new Promise(resolve => spawn(command, args, { stdio: 'inherit' }).on('close', resolve));
}

async function compileSchematics() {
  await spawnPromise(`npx`, ['tsc', '-p', src('schematics', 'tsconfig.json')]);
  return Promise.all([
    copy(src('core', 'builders.json'), dest('builders.json')),
    copy(src('core', 'collection.json'), dest('collection.json')),
    copy(src('schematics', 'deploy', 'schema.json'), dest('schematics', 'deploy', 'schema.json')),
    replaceSchematicVersions()
  ]);
}

async function measure(module: string) {
  const path = dest('bundles', `${module}.umd.min.js`);
  const file = await readFile(path);
  const gzip = prettySize(gzipSync(file), true);
  const size = prettySize(file.byteLength, true);
  return { size, gzip };
}

async function fixImportForLazyModules() {
  // firebase-lazy/memory is special-case, make sure to also cover that as we make changes
  await Promise.all(LAZY_MODULES.map(async ([module, _sdk]) => {
    const sdk = _sdk || module;
    const packageJson = JSON.parse((await readFile(dest(module, 'package.json'))).toString());
    const entries = Array.from(new Set(Object.values(packageJson).filter(v => typeof v === 'string' && v.endsWith('.js')))) as string[];
    // TODO don't hardcode esm2015 here, perhaps we should scan all the entry directories
    //      e.g, if ng-packagr starts building other non-flattened entries we'll lose the dynamic import
    entries.push(`../esm2015/${module}/public_api.js`); // the import isn't pulled into the ESM public_api
    await Promise.all(entries.map(async path => {
      const source = (await readFile(dest(module, path))).toString();
      let newSource: string;
      if (path.endsWith('.umd.js')) {
        // in the UMD for lazy modules replace the dyanamic import
        newSource = source.replace(`import('firebase/${sdk}')`, 'rxjs.of(undefined)');
      } else {
        // in everything else get rid of the global side-effect import
        newSource = source.replace(new RegExp(`^import 'firebase/${sdk}'.+$`, 'gm'), '');
      }
      await writeFile(dest(module, path), newSource);
    }));
  }));
}

async function fixFirestoreLazyMemoryModule() {
  const module = 'firestore-lazy/memory';
  const packageJson = JSON.parse((await readFile(dest(module, 'package.json'))).toString());
  const entries = Array.from(new Set(Object.values(packageJson).filter(v => typeof v === 'string' && v.endsWith('.js')))) as string[];
  // TODO don't hardcode esm2015 here, perhaps we should scan all the entry directories
  //      e.g, if ng-packagr starts building other non-flattened entries we'll lose the dynamic import
  entries.push(`../../esm2015/${module}/public_api.js`); // the import isn't pulled into the ESM public_api
  entries.push(`../../esm2015/${module}/firestore.js`);
  await Promise.all(entries.map(async path => {
    const source = (await readFile(dest(module, path))).toString();
    let newSource: string;
    if (path.endsWith('.umd.js')) {
      // in the UMD for lazy modules replace the dyanamic import
      newSource = source.replace('import(\'firebase/firestore\')', 'rxjs.of(undefined)')
        .replace('require(\'firebase/firestore\')', 'require(\'firebase/firestore/memory\')')
        .replace(', \'firebase/firestore\',', ', \'firebase/firestore/memory\',');
    } else {
      // in everything else get rid of the global side-effect import
      newSource = source.replace(/^import 'firebase\/firestore'.+$/gm, '')
        .replace('import(\'firebase/firestore\')', 'import(\'firebase/firestore/memory\')');
    }
    await writeFile(dest(module, path), newSource);
  }));
}

async function buildLibrary() {
  await proxyPolyfillCompat();
  await spawnPromise('npx', ['ng', 'build']);
  await Promise.all([
    copy(join(process.cwd(), '.npmignore'), dest('.npmignore')),
    copy(join(process.cwd(), 'README.md'), dest('README.md')),
    copy(join(process.cwd(), 'docs'), dest('docs')),
    compileSchematics(),
    replacePackageJsonVersions(),
    replacePackageCoreVersion(),
    fixImportForLazyModules(),
    fixFirestoreLazyMemoryModule(),
  ]);
}

function measureLibrary() {
  return Promise.all(UMD_NAMES.map(measure));
}

async function buildDocs() {
  // INVESTIGATE json to stdout rather than FS?
  await Promise.all(MODULES.map(module => spawnPromise('npx', ['typedoc', `./src/${module}`, '--json', `./dist/typedocs/${module}.json`])));
  const entries = await Promise.all(MODULES.map(async (module) => {
    const buffer = await readFile(`./dist/typedocs/${module}.json`);
    const typedoc = JSON.parse(buffer.toString());
    // TODO infer the entryPoint from the package.json
    const entryPoint = typedoc.children.find((c: any) => c.name === '"public_api"');
    const allChildren = [].concat(...typedoc.children.map(child =>
      // TODO chop out the working directory and filename
      child.children ? child.children.map(c => ({ ...c, path: dirname(child.originalName.split(process.cwd())[1]) })) : []
    ));
    return entryPoint.children
      .filter(c => c.name[0] !== 'ɵ' && c.name[0] !== '_' /* private */)
      .map(child => ({ ...allChildren.find(c => child.target === c.id) }))
      .reduce((acc, child) => ({ ...acc, [encodeURIComponent(child.name)]: child }), {});
  }));
  const root = await rootPackage;
  const pipes = ['MonoTypeOperatorFunction', 'OperatorFunction', 'AuthPipe', 'UnaryFunction'];
  const tocType = child => {
    const decorators: string[] = child.decorators && child.decorators.map(d => d.name) || [];
    if (decorators.includes('NgModule')) {
      return 'NgModule';
    } else if (child.kindString === 'Type alias') {
      return 'Type alias';
    } else if (child.kindString === 'Variable' && child.defaultValue && child.defaultValue.startsWith('new InjectionToken')) {
      return 'InjectionToken';
    } else if (child.type) {
      return pipes.includes(child.type.name) ? 'Pipe' : child.type.name;
    } else if (child.signatures && child.signatures[0] && child.signatures[0].type && pipes.includes(child.signatures[0].type.name)) {
      return 'Pipe';
    } else {
      return child.kindString;
    }
  };
  const tableOfContents = entries.reduce((acc, entry, index) =>
      ({
        ...acc, [MODULES[index]]: {
          name: ENTRY_NAMES[index],
          exports: Object.keys(entry).reduce((acc, key) => ({ ...acc, [key]: tocType(entry[key]) }), {})
        }
      }),
    {}
  );
  const afdoc = entries.reduce((acc, entry, index) => ({ ...acc, [MODULES[index]]: entry }), { table_of_contents: tableOfContents });
  return writeFile(`./api-${root.version}.json`, JSON.stringify(afdoc, null, 2));
}

function packLibrary() {
  return spawnPromise('npm', ['pack', './dist/packages-dist']);
}

Promise.all([
  buildDocs(),
  buildLibrary().then(packLibrary)
]).then(measureLibrary).then(stats =>
  console.log(`
Package         Size    Gzipped
------------------------------------
${stats.map((s, i) => [MODULES[i].padEnd(16), s.size.padEnd(8), s.gzip].join('')).join('\n')}`
  )
);
