/**
 * This file uses the test project at test/typings-test to validate
 * that AngularFire typings don't produce errors in user code.
 *
 * 1. Create a temp directory to copy the test project
 * 2. Create a package.json based on test-project/package.sample.json,
 *    using versions from the project's root package.json.
 * 3. NPM install inside the temporary project directory
 * 4. Run TSC against the project's local tsconfig.json and local node_modules
 * 5.
 */
const fs = require('fs');
const path = require('path');
const ncp = require('ncp');
const rimraf = require('rimraf');
const child_process = require('child_process');
const pathToTestSrcFolder = path.resolve(__dirname, '../test/typings-test/');
const binaryPath = path.resolve(__dirname, '../node_modules/.bin')
const rootPackage = require(path.resolve(__dirname, '../package.json'));

const startingCwd = process.cwd();

const pathToTestFolder = fs.mkdtempSync('/tmp/typings-test-');

process.chdir(pathToTestFolder)

ncp(pathToTestSrcFolder, pathToTestFolder, () => {
  const samplePackage = require(`${pathToTestFolder}/package.sample.json`);

  fs.writeFileSync(`${pathToTestFolder}/package.json`, JSON.stringify(samplePackage, null, 2)
    .replace('{{ANGULARFIRE_VERSION}}', path.resolve(__dirname, '../dist/packages-dist'))
    .replace('{{FIREBASE_VERSION}}', rootPackage.dependencies.firebase)
    .replace('{{RXJS_VERSION}}', rootPackage.dependencies.rxjs)
    .replace('{{ZONE_VERSION}}', rootPackage.dependencies['zone.js'])
    .replace('{{TYPESCRIPT_VERSION}}', rootPackage.devDependencies.typescript)
    .replace(/\{\{ANGULAR_VERSION\}\}/g, rootPackage.dependencies['@angular/core']));

    spawnIt('npm', ['install'])
      .then(_ => spawnIt(`${pathToTestFolder}/node_modules/.bin/tsc`, ['--version']))
      .then(_ => new Promise((res, rej) => {
        child_process.exec(`${pathToTestFolder}/node_modules/.bin/tsc --diagnostics -p ${pathToTestFolder}/tsconfig-test.json`, (err, stdout, stderr) => {
          console.log(stdout);
          if (err) {
            rej(1);
          } else {
            res();
          }
        });
      }))
      .catch(_ => {
        // resolve with exit code 1
        return Promise.resolve(1)
      })
      .then(cleanup)
      .then(code => process.exit(code || 0));
})

function spawnIt(program, args) {
  console.log('-----------------------------------');
  console.log(program, (args && args.join(' ')) || '');
  console.log('-----------------------------------');
  return new Promise((res, rej) => {
    child_process.spawn(program, args, {
      cwd: pathToTestFolder,
      stdio: 'inherit'
    })
      .on('close', (code) => {
        if (code) return rej(code);
        res();
      })
  });
}

function cleanup (val) {
  rimraf.sync(pathToTestFolder);
  return val;
}
