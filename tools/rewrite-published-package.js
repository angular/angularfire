/**
 * Rewrite the package.json that gets published to npm.
 * * Change main to point to angularfire.js instead of dist/angularfire.js
 * * Change angular2 to be a peer dependency
 */
var fs = require('fs');
var srcPackage = require('../package.json');
var outPackage = Object.assign({}, srcPackage, {
  peerDependencies: srcPackage.dependencies,
  main: "angularfire2.js"
});
delete outPackage.dependencies;

fs.writeFileSync('./dist/package.json', JSON.stringify(outPackage, null, 2));
