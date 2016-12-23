// Karma configuration
module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: ['jasmine'],

    files: [
      // Polyfills.
      'node_modules/es6-shim/es6-shim.js',

      'node_modules/reflect-metadata/Reflect.js',

      // Zone.js dependencies
      'node_modules/zone.js/dist/zone.js',
      'node_modules/zone.js/dist/proxy.js',
      'node_modules/zone.js/dist/sync-test.js',
      'node_modules/zone.js/dist/jasmine-patch.js',
      'node_modules/zone.js/dist/async-test.js',
      'node_modules/zone.js/dist/fake-async-test.js',

      'node_modules/rxjs/bundles/Rx.{js,map}',

      ...getAngularFiles(['core','common','compiler','platform-browser','platform-browser-dynamic']),

      'karma-test-shim.js',
      'node_modules/firebase/firebase.js',
      'dist/bundles/test-root.umd.{js,map}',
    ],

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    reporters: ['mocha'],
    browsers: ['Chrome'],
    singleRun: false
  })
};

function getAngularFiles(packages) {
  return packages.reduce((files, pkg) => {
    files.push(`node_modules/@angular/${pkg}/bundles/${pkg}.umd.js`);
    files.push(`node_modules/@angular/${pkg}/bundles/${pkg}-testing.umd.js`);
    return files;
  }, []);
}
