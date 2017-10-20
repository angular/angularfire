const fs = require('fs');
const { spawn, spawnSync } = require('child_process');
const ng5Pkg = require('./ng5/package.json');
const pkg = require('../../package.json');
const shell = require('shelljs');

const PACKAGED_VERSION = `angularfire2-${pkg.version}.tgz`;

function packageAngularFire() {
  console.log(`------------ PACKAGING VERSION ${PACKAGED_VERSION} ------------`);
  const res = spawnSync('sh', ['pack.sh']);
  console.log(`------------ FINISHED PACKAGING VERSION ${PACKAGED_VERSION} ------------`);
  console.log(`------------ INSTALLING VERSION ${PACKAGED_VERSION} ------------`);
  if (shell.exec(`cd ng5 && npm i firebase ../${PACKAGED_VERSION}`).code !== 0) {
    shell.echo('Error');
    shell.exit(1);
  }
  console.log(`------------ FINISHED INSTALLING VERSION ${PACKAGED_VERSION} ------------`);
  buildVersion5();
}

function buildVersion5() {
  console.log(`------------ BUILDING VERSION ${ng5Pkg.dependencies['@angular/core']} ------------`);
  const cmd = spawn('sh', ['build.sh']);
  cmd.stdout.on('data', (data) => {
    console.log(data.toString('utf8'));
  });
  cmd.stderr.on('data', (data) => {
    console.log(data.toString('utf8'));
  });
  cmd.on('close', () => {
    try {
      const dir = fs.readdirSync(__dirname + '/ng5/dist');
      console.log(dir);
      console.log(`------------ SUCCESS VERSION ${ng5Pkg.dependencies['@angular/core']} ------------`);
    } catch (e) {
      console.log(`------------ FAIL VERSION ${ng5Pkg.dependencies['@angular/core']} ------------`);
      console.log(e);
      throw new Error('ng build failed');
    }
  });
}

packageAngularFire();
//buildVersion5();
