const { rollup } = require('rollup');
const { spawn } = require('child_process');
const { Observable } = require('rxjs');
const { copy } = require('fs-extra');

// Rollup globals
const GLOBALS = {
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
  'rxjs/operator/auditTime': 'Rx.Observable.prototype',
  'rxjs/operator/switchMap': 'Rx.Observable.prototype',
  'rxjs/operator': 'Rx.Observable.prototype',
  '@angular/core': 'ng.core',
  '@angular/compiler': 'ng.compiler',
  '@angular/platform-browser': 'ng.platformBrowser',
  'firebase/auth': 'firebase',
  'firebase/app': 'firebase',
  'firebase/database': 'firebase',
  'rxjs/scheduler/queue': 'Rx.Scheduler',
  '@angular/core/testing': 'ng.core.testing',
  'angularfire2': 'angularfire2'
};

// constants for running typescript commands
const TSC = 'node_modules/.bin/tsc';
const NGC = 'node_modules/.bin/ngc';
const TSC_ARGS = (name, config = 'build') => [`-p`, `${process.cwd()}/src/${name}/tsconfig-${config}.json`];

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
    cmd.stderr.on('data', (data) => { observer.error(data.toString('utf8')); });
    cmd.on('close', (data) => { observer.complete(); });
  });
}

function createUmd(name, globals) {
  // core module is angularfire2 the rest are angularfire2.feature
  const moduleName = name === 'core' ? 'angularfire2' : `angularfire2.${name}`;
  // core is at the root and the rest are in their own folders
  const entry = name === 'core' ? `${process.cwd()}/dist/packages-dist/index.js` : 
    `${process.cwd()}/dist/packages-dist/${name}/index.js`;
  return rollup({ entry })
    .then(bundle => {
      const result = bundle.generate({
        format: 'umd',
        external: Object.keys(globals),
        globals,
        moduleName
      });
      return bundle.write({
        format: 'umd',
        dest: `${process.cwd()}/dist/packages-dist/bundles/${name}.umd.js`,
        external: Object.keys(globals),
        globals,
        moduleName
      });
    });
}

function getSrcPackageFile(moduleName) {
  const PATHS = {
    core: `${process.cwd()}/src/core/package.json`,
    auth: `${process.cwd()}/src/auth/package.json`,
    database: `${process.cwd()}/src/database/package.json`
  };
  return PATHS[moduleName];
}

function getDestPackageFile(moduleName) {
  const PATHS = {
    core: `${process.cwd()}/dist/packages-dist/package.json`,
    auth: `${process.cwd()}/dist/packages-dist/auth/package.json`,
    database: `${process.cwd()}/dist/packages-dist/database/package.json`
  };
  return PATHS[moduleName];
}

function copyPackage(moduleName) {
  return copy(getSrcPackageFile(moduleName), getDestPackageFile(moduleName));
}

function buildModule(name, globals) {
  const es2015$ = spawnObservable(NGC, TSC_ARGS(name));
  const esm$ = spawnObservable(NGC, TSC_ARGS(name, 'esm'));
  return Observable
    .forkJoin(es2015$, esm$)
    .switchMap(() => Observable.from(createUmd(name, globals)))
    .switchMap(() => Observable.from(copyPackage(name)));
}

function buildLibrary(globals) {
  const core$ = buildModule('core', globals);
  const auth$ = buildModule('auth', globals);
  const db$ = buildModule('database', globals);
  return Observable
    .forkJoin(core$)
    .switchMapTo(auth$)
    .switchMapTo(db$);
}

const $lib = buildLibrary(GLOBALS).subscribe(
  data => { console.log('data', data) },
  err => { console.log('err', err) },
  () => { console.log('complete') }
);
