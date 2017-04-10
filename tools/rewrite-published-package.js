/**
 * Rewrite the package.json that gets published to npm.
 * * Change main to point to angularfire.js instead of dist/angularfire.js
 * * Change angular2 to be a peer dependency
 */
var fs = require('fs');
var srcPackage = require('../package.json');

delete srcPackage.scripts;

var peerDependencies = Object.assign({}, srcPackage.dependencies);

delete srcPackage.dependencies;

var outPackage = Object.assign({}, srcPackage, { peerDependencies });

fs.writeFileSync('./dist/package.json', JSON.stringify(outPackage, null, 2));

// It's also necessary to copy any deep-path package.json files.
// See https://github.com/angular/angularfire2/issues/880

['app', 'auth', 'database'].forEach(dir => {
  fs.writeFileSync(`./dist/${dir}/package.json`, fs.readFileSync(`./src/${dir}/package.json`));
});
