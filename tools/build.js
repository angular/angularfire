const { rollup } = require('rollup');
const { spawn } = require('child_process');
const { Observable } = require('rxjs');
const { copy, rename, readdirSync } = require('fs-extra');

function spawnObservable(command, args) {
  return Observable.create(observer => {
    const cmd = spawn(command, args);
    observer.next(''); // hack to kick things off, not every command will have a stdout
    cmd.stdout.on('data', (data) => { observer.next(data.toString('utf8')); });
    cmd.stderr.on('data', (data) => { observer.error(data.toString('utf8')); });
    cmd.on('close', (data) => { observer.complete(); });
  });
}

function createUmd(name) {
  // core module is angularfire2 the rest are angularfire2.feature
  const moduleName = name === 'core' ? 'angularfire2' : `angularfire2.${name}`;
  // core is at the root and the rest are in their own folders
  const entry = name === 'core' ? `${process.cwd()}/dist/packages-dist/index.js` : 
    `${process.cwd()}/dist/packages-dist/${name}/index.js`;
  return rollup({ entry })
    .then(bundle => {
      const result = bundle.generate({
        format: 'umd',
        moduleName
      });
      return bundle.write({
        format: 'umd',
        dest: `${process.cwd()}/dist/bundles/${name}.umd.js`,
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

// constants for running typescript commands
const TSC = 'node_modules/.bin/tsc';
const NGC = 'node_modules/.bin/ngc';
const TSC_ARGS = (name, config = 'build') => [`-p`, `${process.cwd()}/src/${name}/tsconfig-${config}.json`];

function buildModule(name) {
  // Run tsc on module (TS -> ES2015)
  const es2015$ = spawnObservable(TSC, TSC_ARGS(name));
  const esm$ = spawnObservable(TSC, TSC_ARGS(name, 'esm'));
  return Observable
    .forkJoin(es2015$, esm$)
    .mergeMap(() => Observable.from(createUmd(name)))
    .mergeMap(() => Observable.from(copyPackage(name)));
}

buildModule('core').subscribe(
  data => { console.log(data) },
  err => { console.log(err) },
  () => { console.log('complete') }
);
