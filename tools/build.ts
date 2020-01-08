import { spawn } from 'child_process';
import { copy, writeFile, readFile } from 'fs-extra';
import { prettySize } from 'pretty-size';
import { sync as gzipSync } from 'gzip-size';
import { join } from 'path';

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

async function replaceDynamicImportsForUMD() {
  const perfPath = dest('bundles', 'angular-fire-performance.umd.js');
  const messagingPath = dest('bundles', 'angular-fire-messaging.umd.js');
  const [perf, messaging] = await Promise.all([
    readFile(perfPath, 'utf8'),
    readFile(messagingPath, 'utf8')
  ]);
  return Promise.all([
    writeFile(perfPath, perf.replace("rxjs.from(import('firebase/performance'))", "rxjs.empty()")),
    writeFile(messagingPath, messaging.replace("rxjs.from(import('firebase/messaging'))", "rxjs.empty()"))
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
    replacePackageJsonVersions(),
    replaceDynamicImportsForUMD()
  ]);
  return Promise.all([
    measure('angular-fire'),
    measure('angular-fire-analytics'),
    measure('angular-fire-auth'),
    measure('angular-fire-auth-guard'),
    measure('angular-fire-database'),
    measure('angular-fire-firestore'),
    measure('angular-fire-functions'),
    measure('angular-fire-remote-config'),
    measure('angular-fire-storage'),
    measure('angular-fire-messaging'),
    measure('angular-fire-performance')
  ]);
}

async function buildWrapper() {
  await copy(src('wrapper'), join(process.cwd(), 'dist', 'wrapper-dist'));
  const root = await rootPackage;
  const path = join(process.cwd(), 'dist', 'wrapper-dist', 'package.json');
  var pkg = await import(path);
  pkg.dependencies['@angular/fire'] = pkg.version = root.version;
  return writeFile(path, JSON.stringify(pkg, null, 2));
}

buildLibrary().then(stats => {
  var line = 0;
  console.log(`
Package      Size     Gzipped
-----------------------------
Core         ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Analytics    ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Auth         ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
AuthGuard    ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Database     ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Firestore    ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Functions    ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
RemoteConfig ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Storage      ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Messaging    ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Performance  ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
  `);
  return buildWrapper();
});