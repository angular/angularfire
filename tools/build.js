// TS -> ES2015 -> ES5 -> UMD

// tsc -> tsc -p -> rollup

const { rollup } = require('rollup');
const { spawn } = require('child_process');
const { Observable } = require('rxjs');
const { copy } = require('fs-extra');

function spawnObservable(command, args) {
  return Observable.create(observer => {
    const cmd = spawn(command, args);
    observer.next('');
    cmd.stdout.on('data', (data) => { observer.next(data.toString('utf8')); });
    cmd.stderr.on('data', (data) => { observer.error(data.toString('utf8')); });
    cmd.on('close', (data) => { observer.complete(); });
  });
}

function createUmd(module) {
  return rollup({
    entry: `${process.cwd()}/dist/packages/${module}/index.js`
  })
    .then(bundle => {
      const result = bundle.generate({
        format: 'umd',
        moduleName: 'angularfire2'
      });
      return bundle.write({
        format: 'umd',
        dest: `${process.cwd()}/dist/bundles/${module}.umd.js`,
        moduleName: 'angularfire2'
      });
    });
}

function getSrcPackageFile(module) {
  return `${process.cwd()}/src/${module}/package.json`;
}

function getDestPackageFile(module) {
  return `${process.cwd()}/dist/packages/${module}/package.json`;
}

function buildModule(name) {
  const module$ = spawnObservable('node_modules/.bin/tsc', [`-p`, `${process.cwd()}/src/${name}/tsconfig-build.json`]);
  // Run tsc -> copy files -> run rollup
  return module$
    .mergeMap(() => {
      return Observable.from(copy(getSrcPackageFile(name), getDestPackageFile(name)))
    })
    .mergeMap(() => {
      return Observable.from(createUmd(name))
    });
}

buildModule('core').subscribe(
  data => { console.log(data) },
  err => { console.log(err) },
  () => { console.log('complete') }
);
