import { spawn } from 'child_process';
import { copy, writeFile, readFile, accessSync } from 'fs-extra';
import { prettySize } from 'pretty-size';
import { sync as gzipSync } from 'gzip-size';
import { join, dirname } from 'path';

// TODO infer these from the package.json
const MODULES = [
  'core', 'analytics', 'auth', 'auth-guard', 'database',
  'database-deprecated', 'firestore', 'functions', 'remote-config',
  'storage', 'messaging', 'performance'
];
const UMD_NAMES = MODULES.map(m => m === 'core' ? 'angular-fire' : `angular-fire-${m}`);
const ENTRY_NAMES = MODULES.map(m => m === 'core' ? '@angular/fire' : `@angular/fire/${m}`);

const src = (...args:string[]) => join(process.cwd(), 'src', ...args);
const dest = (...args:string[]) => join(process.cwd(), 'dist', 'packages-dist', ...args);

const rootPackage = import(join(process.cwd(), 'package.json'));

async function replacePackageJsonVersions() {
  const path = dest('package.json');
  const root = await rootPackage;
  var pkg = await import(path);
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
  return writeFile(path, JSON.stringify(dependencies, null, 2));
}

function spawnPromise(command: string, args: string[]) {
  return new Promise(resolve => spawn(command, args, {stdio: 'inherit'}).on('close', resolve));
}

async function compileSchematics() {
  await spawnPromise(`npx`, ['tsc', '-p', src('schematics', 'tsconfig.json')]);
  return Promise.all([
    copy(src('core', 'builders.json'), dest('builders.json')),
    copy(src('core', 'collection.json'), dest('collection.json')),
    copy(src('schematics', 'deploy', 'schema.json'), dest('deploy', 'schema.json')),
    replaceSchematicVersions()
  ]);
}

async function measure(module: string) {
  const path = dest('bundles', `${module}.umd.js`);
  const file = await readFile(path);
  const gzip = prettySize(gzipSync(file), true);
  const size = prettySize(file.byteLength, true);
  return { size, gzip };
}

async function buildLibrary() {
  await spawnPromise('npx', ['ng', 'build']);
  await Promise.all([
    copy(join(process.cwd(), '.npmignore'), dest('.npmignore')),
    copy(join(process.cwd(), 'README.md'), dest('README.md')),
    copy(join(process.cwd(), 'docs'), dest('docs')),
    copy(src('firebase-node'), dest('firebase-node')),
    compileSchematics(),
    replacePackageJsonVersions()
  ]);
}

function measureLibrary() {
  return Promise.all(UMD_NAMES.map(measure));
}

async function buildDocs() {
  // INVESTIGATE json to stdout rather than FS?
  await Promise.all(MODULES.map(module => spawnPromise('npx', ['typedoc', `./src/${module}`, '--json', `./dist/typedocs/${module}.json`])));
  const entries = await Promise.all(MODULES.map(async (module, index) => {
    const buffer = await readFile(`./dist/typedocs/${module}.json`);
    const typedoc = JSON.parse(buffer.toString());
    // TODO infer the entryPoint from the package.json
    const entryPoint = typedoc.children.find((c:any) => c.name === "\"public_api\"");
    const allChildren = [].concat(...typedoc.children.map(child =>
      // TODO chop out the working directory and filename
      child.children ? child.children.map(c => ({...c, path: dirname(child.originalName.split(process.cwd())[1])})) : []
    ));
    return entryPoint.children
      .filter(c => c.name[0] !== 'ɵ' && c.name[0] !== '_' /* private */)
      .map(child => ({...allChildren.find(c => child.target === c.id)}))
      .reduce((acc, child) => ({...acc, [encodeURIComponent(child.name)]: child}), {});
  }));
  const root = await rootPackage;
  const pipes = ['MonoTypeOperatorFunction', 'OperatorFunction', 'AuthPipe', 'UnaryFunction'];
  const tocType = child => {
    const decorators: string[] = child.decorators && child.decorators.map(d => d.name) || [];
    if (decorators.includes('NgModule')) {
      return 'NgModule'
    } else if (child.kindString === 'Type alias') {
      return 'Type alias';
    } else if (child.kindString === 'Variable' && child.defaultValue && child.defaultValue.startsWith('new InjectionToken')) {
      return 'InjectionToken'
    } else if (child.type) {
      return pipes.includes(child.type.name) ? 'Pipe' : child.type.name;
    } else if (child.signatures && child.signatures[0] && child.signatures[0].type && pipes.includes(child.signatures[0].type.name)) {
      return 'Pipe';
    } else {
      return child.kindString;
    }
  }
  const table_of_contents = entries.reduce((acc, entry, index) =>
    ({...acc, [MODULES[index]]: {name: ENTRY_NAMES[index], exports: Object.keys(entry).reduce((acc, key) => ({...acc, [key]: tocType(entry[key])}), {})}}),
    {}
  );
  const afdoc = entries.reduce((acc, entry, index) => ({...acc, [MODULES[index]]: entry }), { table_of_contents });
  return writeFile(`./api-${root.version}.json`, JSON.stringify(afdoc, null, 2));
}

async function buildWrapper() {
  await copy(src('wrapper'), join(process.cwd(), 'dist', 'wrapper-dist'));
  const root = await rootPackage;
  const path = join(process.cwd(), 'dist', 'wrapper-dist', 'package.json');
  var pkg = await import(path);
  pkg.dependencies['@angular/fire'] = pkg.version = root.version;
  return writeFile(path, JSON.stringify(pkg, null, 2));
}

buildLibrary().then(buildWrapper).then(buildDocs).then(measureLibrary).then(stats =>
  console.log(`
Package      Size     Gzipped
-----------------------------
${stats.map((s, i) => [MODULES[i].padEnd(20), s.size.padEnd(8), s.gzip].join("")).join("\n")}`
  )
);