/**
 * Rewrite the package.json that gets published to npm.
 * * Change main to point to angularfire.js instead of dist/angularfire.js
 * * Change angular2 to be a peer dependency
 */
var fs = require('fs');
var srcPackage = require('../package.json');

delete srcPackage.scripts;

var peerDependencies = Object.assign({}, srcPackage.dependencies);
// See note about including firebase as dependency
delete peerDependencies.firebase;

var outPackage = Object.assign({}, srcPackage, {
  peerDependencies,
  dependencies: {
    /**
     * Firebase SDK should be a dependency since it's not required that
     * projects will install/use the SDK directly. And since Firebase uses
     * semver, the version restriction is more permissive. This means if the user
     * has installed Firebase already, npm is more likely to find a matching version.
     **/
     firebase: srcPackage.dependencies.firebase
  }
});

fs.writeFileSync('./dist/package.json', JSON.stringify(outPackage, null, 2));
