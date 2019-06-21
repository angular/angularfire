import { spawn } from 'child_process';
import { copy, writeFile, readFile } from 'fs-extra';
import { prettySize } from 'pretty-size';
import { sync as gzipSync } from 'gzip-size';
import { ngPackagr } from 'ng-packagr';

const rootPackage = import(`${process.cwd()}/package.json`);

async function replaceVersions(path) {
  const root = await rootPackage;
  var pkg = await import(path);
  Object.keys(pkg.peerDependencies).forEach(peer => {
    pkg.peerDependencies[peer] = root.dependencies[peer];
  });
  pkg.version = root.version;
  return writeFile(path, JSON.stringify(pkg, null, 2));
}

function spawnPromise(command, args) {
  return new Promise(resolve => {
    const cmd = spawn(command, args);
    cmd.on('close', resolve);
  });
}

async function compileSchematics() {
  await spawnPromise('node_modules/.bin/tsc', ['-p', 'src/schematics/tsconfig.json']);
  return Promise.all([
    copy(`${process.cwd()}/src/core/builders.json`, `${process.cwd()}/dist/packages-dist/builders.json`),
    copy(`${process.cwd()}/src/core/collection.json`, `${process.cwd()}/dist/packages-dist/collection.json`),
    copy(`${process.cwd()}/src/schematics/deploy/schema.json`, `${process.cwd()}/dist/packages-dist/schematics/deploy/schema.json`)
  ]);
}

async function replaceDynamicImportsForUMD() {
  const perfPath = './dist/packages-dist/bundles/angular-fire-performance.umd.js';
  const messagingPath = './dist/packages-dist/bundles/angular-fire-messaging.umd.js';
  const [perf, messaging] = await Promise.all([
    readFile(perfPath, 'utf8'),
    readFile(messagingPath, 'utf8')
  ]);
  return Promise.all([
    writeFile(perfPath, perf.replace("rxjs.from(import('firebase/performance'))", "rxjs.empty()")),
    writeFile(messagingPath, messaging.replace("rxjs.from(import('firebase/messaging'))", "rxjs.empty()"))
  ]);
}

async function measure(module) {
  const path = `${process.cwd()}/dist/packages-dist/bundles/${module}.umd.js`;
  const file = await readFile(path);
  const gzip = prettySize(gzipSync(file), true);
  const size = prettySize(file.byteLength, true);
  return { size, gzip };
}

async function buildLibrary() {
  await ngPackagr().forProject(`${process.cwd()}/src/package.json`).build();
  await Promise.all([
    copy(`${process.cwd()}/.npmignore`, `${process.cwd()}/dist/packages-dist/.npmignore`),
    copy(`${process.cwd()}/README.md`, `${process.cwd()}/dist/packages-dist/README.md`),
    copy(`${process.cwd()}/docs`, `${process.cwd()}/dist/packages-dist/docs`),
    copy(`${process.cwd()}/src/firebase-node`, `${process.cwd()}/dist/packages-dist/firebase-node`),
    compileSchematics(),
    replaceVersions(`${process.cwd()}/dist/packages-dist/package.json`),
    replaceDynamicImportsForUMD()
  ]);
  return Promise.all([
    measure('angular-fire'),
    measure('angular-fire-auth'),
    measure('angular-fire-auth-guard'),
    measure('angular-fire-database'),
    measure('angular-fire-firestore'),
    measure('angular-fire-functions'),
    measure('angular-fire-storage'),
    measure('angular-fire-messaging'),
    measure('angular-fire-performance')
  ]);
}

async function buildWrapper() {
  await copy(`${process.cwd()}/src/wrapper`, `${process.cwd()}/dist/wrapper-dist`);
  const root = await rootPackage;
  const path = `${process.cwd()}/dist/wrapper-dist/package.json`;
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
Auth         ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
AuthGuard    ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Database     ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Firestore    ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Functions    ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Storage      ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Messaging    ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
Performance  ${stats[line].size.padEnd(8)} ${stats[line++].gzip}
  `);
  return buildWrapper();
});