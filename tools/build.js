const { rollup } = require('rollup');
const { spawn } = require('child_process');
const { Observable } = require('rxjs');
const { copy, readFileSync, writeFile, statSync } = require('fs-extra');
const { prettySize } = require('pretty-size');
const gzipSize = require('gzip-size');
const resolve = require('rollup-plugin-node-resolve');
const pkg = require(`${process.cwd()}/package.json`);

// Rollup globals
const GLOBALS = {
  'rxjs': 'Rx',
  'rxjs/Observable': 'Rx',
  'rxjs/Subject': 'Rx',
  'rxjs/Observer': 'Rx',
  'rxjs/Subscription': 'Rx',
  'rxjs/observable/merge': 'Rx.Observable',
  'rxjs/operator/share': 'Rx.Observable.prototype',
  'rxjs/operator/observeOn': 'Rx.Observable.prototype',
  'rxjs/observable/of': 'Rx.Observable.prototype',
  'rxjs/operator/combineLatest': 'Rx.Observable.prototype',
  'rxjs/operator/merge': 'Rx.Observable.prototype',
  'rxjs/operator/map': 'Rx.Observable.prototype',
  'rxjs/observable/of': 'Rx.Observable',
  'rxjs/operator/auditTime': 'Rx.Observable.prototype',
  'rxjs/operator/switchMap': 'Rx.Observable.prototype',
  'rxjs/operator/do': 'Rx.Observable.prototype',
  'rxjs/operator/skip': 'Rx.Observable.prototype',
  'rxjs/operator/take': 'Rx.Observable.prototype',
  'rxjs/operator/toArray': 'Rx.Observable.prototype',
  'rxjs/operator/toPromise': 'Rx.Observable.prototype',
  'rxjs/add/operator/map': 'Rx.Observable.prototype',
  'rxjs/add/operator/scan': 'Rx.Observable.prototype',
  'rxjs/add/operator/skip': 'Rx.Observable.prototype',
  'rxjs/add/operator/do': 'Rx.Observable.prototype',
  'rxjs/add/operator/filter': 'Rx.Observable.prototype',
  'rxjs/add/operator/skipUntil': 'Rx.Observable.prototype',
  'rxjs/add/operator/skipWhile': 'Rx.Observable.prototype',
  'rxjs/add/operator/withLatestFrom': 'Rx.Observable.prototype',
  'rxjs/add/observable/merge': 'Rx.Observable',
  'rxjs/add/operator/delay': 'Rx.Observable',
  'rxjs/add/operator/debounce': 'Rx.Observable',
  'rxjs/observable/fromEvent': 'Rx.Observable',
  'rxjs/operator': 'Rx.Observable.prototype',
  '@angular/core': 'ng.core',
  '@angular/compiler': 'ng.compiler',
  '@angular/platform-browser': 'ng.platformBrowser',
  'firebase/auth': 'firebase',
  'firebase/app': 'firebase',
  'firebase/database': 'firebase',
  'rxjs/scheduler/queue': 'Rx.Scheduler',
  '@angular/core/testing': 'ng.core.testing',
  'angularfire2': 'angularfire2',
  'angularfire2/auth': 'angularfire2.auth',
  'angularfire2/database': 'angularfire2.database',
  'angularfire2/database-deprecated': 'angularfire2.database_deprecated',
  'angularfire2/firestore': 'angularfire2.firestore'
};

// Map of dependency versions across all packages
const VERSIONS = {
  ANGULAR_VERSION: pkg.dependencies['@angular/core'],
  FIREBASE_VERSION: pkg.dependencies['firebase'],
  RXJS_VERSION: pkg.dependencies['rxjs'],
  ZONEJS_VERSION: pkg.dependencies['zone.js'],
  ANGULARFIRE2_VERSION: pkg.version,
  FIRESTORE_VERSION: pkg.dependencies['firestore']
};

const MODULE_NAMES = {
  core: 'angularfire2',
  auth: 'angularfire2.auth',
  database: 'angularfire2.database',
  "database-deprecated": 'angularfire2.database_deprecated',
  firestore: 'angularfire2.firestore'
};

const ENTRIES = {
  core: `${process.cwd()}/dist/packages-dist/index.js`,
  auth: `${process.cwd()}/dist/packages-dist/auth/index.js`,
  database: `${process.cwd()}/dist/packages-dist/database/index.js`,
  "database-deprecated": `${process.cwd()}/dist/packages-dist/database-deprecated/index.js`,
  firestore: `${process.cwd()}/dist/packages-dist/firestore/index.js`
};

const SRC_PKG_PATHS = {
  core: `${process.cwd()}/src/core/package.json`,
  auth: `${process.cwd()}/src/auth/package.json`,
  database: `${process.cwd()}/src/database/package.json`,
  "database-deprecated": `${process.cwd()}/src/database-deprecated/package.json`,
  firestore: `${process.cwd()}/src/firestore/package.json`
};

const DEST_PKG_PATHS = {
  core: `${process.cwd()}/dist/packages-dist/package.json`,
  auth: `${process.cwd()}/dist/packages-dist/auth/package.json`,
  database: `${process.cwd()}/dist/packages-dist/database/package.json`,
  "database-deprecated": `${process.cwd()}/dist/packages-dist/database-deprecated/package.json`,
  firestore: `${process.cwd()}/dist/packages-dist/firestore/package.json`
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

function generateBundle(entry, { dest, globals, moduleName }) {
  return rollup({ entry }).then(bundle => {
    return bundle.write({
      format: 'umd',
      external: Object.keys(globals),
      plugins: [resolve()],
      dest,
      globals,
      moduleName,
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
    dest: `${process.cwd()}/dist/packages-dist/bundles/${name}.umd.js`,
    globals,
    moduleName
  });
}

function createTestUmd(globals) {
  const entry = `${process.cwd()}/dist/root.spec.js`;
  const moduleName = 'angularfire2.test';
  return generateBundle(entry, {
    dest: `${process.cwd()}/dist/packages-dist/bundles/test.umd.js`,
    globals,
    moduleName
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
    getDestPackageFile('firestore')
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
  return Observable
    .forkJoin(es2015$, esm$, test$)
    .switchMap(() => Observable.from(createUmd(name, globals)))
    .switchMap(() => replaceVersionsObservable(name, VERSIONS));
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
  return Observable
    .forkJoin(core$, Observable.from(copyRootTest()))
    .switchMapTo(auth$)
    .switchMapTo(db$)
    .switchMapTo(firestore$);
}

function buildLibrary(globals) {
  const modules$ = buildModules(globals);
  return Observable
    .forkJoin(modules$)
    .switchMap(() => Observable.from(createTestUmd(globals)))
    .switchMap(() => Observable.from(copyNpmIgnore()))
    .switchMap(() => Observable.from(copyReadme()))
    .switchMap(() => Observable.from(copyDocs()))
    .do(() => {
      const coreStats = measure('core');
      const authStats = measure('auth');
      const dbStats = measure('database');
      const fsStats = measure('firestore');
      console.log(`
      core.umd.js - ${coreStats.size}, ${coreStats.gzip}
      auth.umd.js - ${authStats.size}, ${authStats.gzip}
      database.umd.js - ${dbStats.size}, ${dbStats.gzip}
      firestore.umd.js - ${fsStats.size}, ${fsStats.gzip}
      `);
      verifyVersions();
    });
}

buildLibrary(GLOBALS).subscribe(
  data => { console.log('data', data) },
  err => { console.log('err', err) },
  () => { console.log('complete') }
);
