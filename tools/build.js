const { rollup } = require('rollup');
const { spawn } = require('child_process');
const { Observable, from, forkJoin } = require('rxjs');
const { switchMap, switchMapTo, tap } = require('rxjs/operators');
const { copy, readFileSync, writeFile, statSync } = require('fs-extra');
const { prettySize } = require('pretty-size');
const gzipSize = require('gzip-size');
const resolve = require('rollup-plugin-node-resolve');
const pkg = require(`${process.cwd()}/package.json`);

// Rollup globals
const GLOBALS = {
  'rxjs': 'rxjs',
  'rxjs/operators': 'rxjs.operators',
  '@angular/common': 'ng.common',
  '@angular/core': 'ng.core',
  '@angular/core/testing': 'ng.core.testing',
  '@angular/platform-browser': 'ng.platformBrowser',
  'firebase': 'firebase',
  'firebase/app': 'firebase',
  'firebase/auth': 'firebase',
  'firebase/database': 'firebase',
  'firebase/messaging': 'firebase',
  'firebase/firestore': 'firebase',
  'firebase/functions': 'firebase',
  'firebase/storage': 'firebase',
  '@angular/fire': 'angularfire2',
  '@angular/fire/auth': 'angularfire2.auth',
  '@angular/fire/database': 'angularfire2.database',
  '@angular/fire/database-deprecated': 'angularfire2.database_deprecated',
  '@angular/fire/firestore': 'angularfire2.firestore',
  '@angular/fire/functions': 'angularfire2.functions',
  '@angular/fire/storage': 'angularfire2.storage',
  '@angular/fire/messaging': 'angularfire2.messaging',
};

// Map of dependency versions across all packages
const VERSIONS = {
  ANGULAR_VERSION: pkg.dependencies['@angular/core'],
  FIREBASE_VERSION: pkg.dependencies['firebase'],
  RXJS_VERSION: pkg.dependencies['rxjs'],
  ZONEJS_VERSION: pkg.dependencies['zone.js'],
  ANGULARFIRE2_VERSION: pkg.version,
  FIRESTORE_VERSION: pkg.dependencies['firestore'],
  WS_VERSION: pkg.dependencies['ws'],
  BUFFERUTIL_VERSION: pkg.optionalDependencies['bufferutil'],
  UTF_8_VALIDATE_VERSION: pkg.optionalDependencies['utf-8-validate'],
  XHR2_VERSION: pkg.dependencies['xhr2'],
  FIREBASE_TOOLS_VERSION: pkg.dependencies["firebase-tools"],
  FUZZY_VERSION: pkg.dependencies["fuzzy"],
  INQUIRER_VERSION: pkg.dependencies["inquirer"],
  INQUIRER_AUTOCOMPLETE_VERSION: pkg.dependencies["inquirer-autocomplete-prompt"]
};

const MODULE_NAMES = {
  core: 'angularfire2',
  auth: 'angularfire2.auth',
  database: 'angularfire2.database',
  "database-deprecated": 'angularfire2.database_deprecated',
  firestore: 'angularfire2.firestore',
  functions: 'angularfire2.functions',
  storage: 'angularfire2.storage',
  messaging: 'angularfire2.messaging',
};

const ENTRIES = {
  core: `${process.cwd()}/dist/packages-dist/index.js`,
  auth: `${process.cwd()}/dist/packages-dist/auth/index.js`,
  database: `${process.cwd()}/dist/packages-dist/database/index.js`,
  "database-deprecated": `${process.cwd()}/dist/packages-dist/database-deprecated/index.js`,
  firestore: `${process.cwd()}/dist/packages-dist/firestore/index.js`,
  functions: `${process.cwd()}/dist/packages-dist/functions/index.js`,
  storage: `${process.cwd()}/dist/packages-dist/storage/index.js`,
  messaging: `${process.cwd()}/dist/packages-dist/messaging/index.js`,
};

const SRC_PKG_PATHS = {
  core: `${process.cwd()}/src/core/package.json`,
  auth: `${process.cwd()}/src/auth/package.json`,
  database: `${process.cwd()}/src/database/package.json`,
  "database-deprecated": `${process.cwd()}/src/database-deprecated/package.json`,
  firestore: `${process.cwd()}/src/firestore/package.json`,
  "firebase-node": `${process.cwd()}/src/firebase-node/package.json`,
  functions: `${process.cwd()}/src/functions/package.json`,
  storage: `${process.cwd()}/src/storage/package.json`,
  messaging: `${process.cwd()}/src/messaging/package.json`,
};

const DEST_PKG_PATHS = {
  core: `${process.cwd()}/dist/packages-dist/package.json`,
  auth: `${process.cwd()}/dist/packages-dist/auth/package.json`,
  database: `${process.cwd()}/dist/packages-dist/database/package.json`,
  "database-deprecated": `${process.cwd()}/dist/packages-dist/database-deprecated/package.json`,
  firestore: `${process.cwd()}/dist/packages-dist/firestore/package.json`,
  "firebase-node": `${process.cwd()}/dist/packages-dist/firebase-node/package.json`,
  functions: `${process.cwd()}/dist/packages-dist/functions/package.json`,
  storage: `${process.cwd()}/dist/packages-dist/storage/package.json`,
  messaging: `${process.cwd()}/dist/packages-dist/messaging/package.json`,
};

// Constants for running typescript commands
const TSC = 'node_modules/.bin/tsc';
const NGC = 'node_modules/.bin/ngc';
const TSC_ARGS = (name, config = 'build') => [`-p`, `${process.cwd()}/src/${name}/tsconfig-${config}.json`];
const TSC_TEST_ARGS = [`-p`, `${process.cwd()}/src/tsconfig-test.json`];

/**
 * Create an Observable of a spawned child process.
 * @param {string} command
 * @param {string[]} args
 */
function spawnObservable(command, args) {
  return Observable.create(observer => {
    const cmd = spawn(command, args);
    observer.next(''); // hack to kick things off, not every command will have a stdout
    cmd.stdout.on('data', (data) => { observer.next(data.toString('utf8')); });
    cmd.stderr.on('data', (data) => { console.log(data); observer.error(data.toString('utf8')); });
    cmd.on('close', (data) => { observer.complete(); });
  });
}

function generateBundle(input, { file, globals, name }) {
  return rollup({
    input,
    external: Object.keys(globals),
    plugins: [resolve()],
    onwarn: warning => {
      // Supress Typescript this warning
      // https://github.com/rollup/rollup/wiki/Troubleshooting#this-is-undefined
      if (warning.code !== 'THIS_IS_UNDEFINED') {
        console.log(warning.message);
      }
    }
  }).then(bundle =>
    bundle.write({
      format: 'umd',
      file,
      globals,
      name,
    })
  );
}

function createFirebaseBundles(featurePaths, globals) {
  return Object.keys(featurePaths).map(feature => {
    return generateBundle(featurePaths[feature], {
      file: `${process.cwd()}/dist/bundles/${feature}.js`,
      globals,
      name: `firebase.${feature}`
    });
  });
}

/**
 * Create a UMD bundle given a module name.
 * @param {string} name
 * @param {Object} globals
 */
function createUmd(name, globals) {
  // core module is angularfire2 the rest are angularfire2.feature
  const moduleName = MODULE_NAMES[name];
  const entry = ENTRIES[name];
  return generateBundle(entry, {
    file: `${process.cwd()}/dist/packages-dist/bundles/${name}.umd.js`,
    globals,
    name: moduleName
  });
}

function createTestUmd(globals) {
  const entry = `${process.cwd()}/dist/root.spec.js`;
  const moduleName = 'angularfire2.test';
  return generateBundle(entry, {
    file: `${process.cwd()}/dist/packages-dist/bundles/test.umd.js`,
    globals,
    name: moduleName
  });
}

/**
 * Get the file path of the src package.json for a module
 * @param {string} moduleName
 */
function getSrcPackageFile(moduleName) {
  return SRC_PKG_PATHS[moduleName];
}

/**
 * Get the file path of the dist package.json for a module
 * @param {string} moduleName
 */
function getDestPackageFile(moduleName) {
  return DEST_PKG_PATHS[moduleName];
}

/**
 * Create an observable of package.json dependency version replacements.
 * This keeps the dependency versions across each package in sync.
 * @param {string} name
 * @param {Object} versions
 */
function replaceVersionsObservable(name, versions) {
  return Observable.create((observer) => {
    const package = getSrcPackageFile(name);
    let pkg = readFileSync(package, 'utf8');
    const regexs = Object.keys(versions).map(key =>
      ({ expr: new RegExp(key, 'g'), key, val: versions[key] }));
    regexs.forEach(reg => {
      pkg = pkg.replace(reg.expr, reg.val);
    });
    const outPath = getDestPackageFile(name);
    writeFile(outPath, pkg, err => {
      if (err) {
        observer.error(err);
      } else {
        observer.next(pkg);
        observer.complete();
      }
    });
  });
}

function copyPackage(moduleName) {
  return copy(getSrcPackageFile(moduleName), getDestPackageFile(moduleName));
}

function copyRootTest() {
  return copy(`${process.cwd()}/src/root.spec.js`, `${process.cwd()}/dist/root.spec.js`);
}

function copyNpmIgnore() {
  return copy(`${process.cwd()}/.npmignore`, `${process.cwd()}/dist/packages-dist/.npmignore`);
}

function copyReadme() {
  return copy(`${process.cwd()}/README.md`, `${process.cwd()}/dist/packages-dist/README.md`);
}

function copyDocs() {
  return copy(`${process.cwd()}/docs`, `${process.cwd()}/dist/packages-dist/docs`);
}

function copyNodeFixes() {
  return copy(`${process.cwd()}/src/firebase-node`, `${process.cwd()}/dist/packages-dist/firebase-node`);
}

function copySchematicFiles() {
  return Promise.all([
    copy(`${process.cwd()}/src/core/builders.json`, `${process.cwd()}/dist/packages-dist/builders.json`),
    copy(`${process.cwd()}/src/core/collection.json`, `${process.cwd()}/dist/packages-dist/collection.json`),
    copy(`${process.cwd()}/src/schematics/deploy/schema.json`, `${process.cwd()}/dist/packages-dist/schematics/deploy`)
  ]);
}

function compileSchematics() {
  return spawnObservable(TSC, [`-p`, `${process.cwd()}/src/schematics/tsconfig.json`]);
}

function measure(module) {
  const path = `${process.cwd()}/dist/packages-dist/bundles/${module}.umd.js`;
  const file = readFileSync(path);
  const gzip = prettySize(gzipSize.sync(file), true);
  const size = prettySize(statSync(path).size, true);
  return { size, gzip };
}

/**
 * Returns each version of each AngularFire module.
 * This is used to help ensure each package has the same verison.
 */
function getVersions() {
  const paths = [
    getDestPackageFile('core'),
    getDestPackageFile('auth'),
    getDestPackageFile('database'),
    getDestPackageFile('firestore'),
    getDestPackageFile('firebase-node'),
    getDestPackageFile('functions'),
    getDestPackageFile('storage'),
    getDestPackageFile('messaging'),
    getDestPackageFile('database-deprecated')
  ];
  return paths
    .map(path => require(path))
    .map(pkgs => pkgs.version);
}

function verifyVersions() {
  const versions = getVersions();
  console.log(versions);
  versions.map(version => {
    if(version !== pkg.version) {
      throw new Error('Versions mistmatch');
      process.exit(1);
    }
  });
}

function buildModule(name, globals) {
  const es2015$ = spawnObservable(NGC, TSC_ARGS(name));
  const esm$ = spawnObservable(NGC, TSC_ARGS(name, 'esm'));
  const test$ = spawnObservable(TSC, TSC_ARGS(name, 'test'));
  return forkJoin(es2015$, esm$, test$).pipe(
    switchMap(() => from(createUmd(name, globals))),
    switchMap(() => replaceVersionsObservable(name, VERSIONS))
  );
}

/**
 * Create an observable of module build status. This method builds
 * @param {Object} globals
 */
function buildModules(globals) {
  const core$ = buildModule('core', globals);
  const auth$ = buildModule('auth', globals);
  const db$ = buildModule('database', globals);
  const firestore$ = buildModule('firestore', globals);
  const functions$ = buildModule('functions', globals);
  const storage$ = buildModule('storage', globals);
  const messaging$ = buildModule('messaging', globals);
  const dbdep$ = buildModule('database-deprecated', globals);
  return forkJoin(core$, from(copyRootTest())).pipe(
    switchMapTo(auth$),
    switchMapTo(db$),
    switchMapTo(firestore$),
    switchMapTo(functions$),
    switchMapTo(storage$),
    switchMapTo(messaging$),
    switchMapTo(dbdep$)
  );
}

function buildLibrary(globals) {
  const modules$ = buildModules(globals);
  return forkJoin(modules$).pipe(
    switchMap(() => from(copyNpmIgnore())),
    switchMap(() => from(copyReadme())),
    switchMap(() => from(copyDocs())),
    switchMap(() => from(copyNodeFixes())),
    switchMap(() => compileSchematics()),
    switchMap(() => from(copySchematicFiles())),
    switchMap(() => replaceVersionsObservable('firebase-node', VERSIONS)),
    switchMap(() => from(createTestUmd(globals))),
    tap(() => {
      const coreStats = measure('core');
      const authStats = measure('auth');
      const dbStats = measure('database');
      const fsStats = measure('firestore');
      const functionsStats = measure('functions');
      const storageStats = measure('storage');
      const messagingStats = measure('messaging');
      const dbdepStats = measure('database-deprecated');
      console.log(`
      core.umd.js - ${coreStats.size}, ${coreStats.gzip}
      auth.umd.js - ${authStats.size}, ${authStats.gzip}
      database.umd.js - ${dbStats.size}, ${dbStats.gzip}
      firestore.umd.js - ${fsStats.size}, ${fsStats.gzip}
      functions.umd.js - ${functionsStats.size}, ${functionsStats.gzip}
      storage.umd.js - ${storageStats.size}, ${storageStats.gzip}
      messaging.umd.js - ${messagingStats.size}, ${messagingStats.gzip}
      database-deprecated.umd.js - ${dbdepStats.size}, ${dbdepStats.gzip}
      `);
      verifyVersions();
    }));
}

buildLibrary(GLOBALS).subscribe(
  data => { console.log('data', data) },
  err => { console.log('err', err) },
  () => { console.log('complete') }
);
