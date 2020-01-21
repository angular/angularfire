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
      'node_modules/zone.js/dist/task-tracking.js',

      'node_modules/rxjs/bundles/rxjs.umd.{js,map}',

      ...getAngularFiles(['core','common','compiler','platform-browser','platform-browser-dynamic']),

      'karma-test-shim.js',
      'node_modules/firebase/firebase-app.js',
      'node_modules/firebase/firebase-auth.js',
      'node_modules/firebase/firebase-database.js',
      'node_modules/firebase/firebase-firestore.js',
      'node_modules/firebase/firebase-functions.js',
      'node_modules/firebase/firebase-performance.js',
      'node_modules/firebase/firebase-storage.js',
      'dist/packages-dist/bundles/core.umd.{js,map}',
      'dist/packages-dist/bundles/auth.umd.{js,map}',
      'dist/packages-dist/bundles/analytics.umd.{js,map}',
      'dist/packages-dist/bundles/auth-guard.umd.{js,map}',
      'dist/packages-dist/bundles/database.umd.{js,map}',
      'dist/packages-dist/bundles/firestore.umd.{js,map}',
      'dist/packages-dist/bundles/functions.umd.{js,map}',
      'dist/packages-dist/bundles/messaging.umd.{js,map}',
      'dist/packages-dist/bundles/remote-config.umd.{js,map}',
      'dist/packages-dist/bundles/storage.umd.{js,map}',
      'dist/packages-dist/bundles/performance.umd.{js,map}',
      'dist/packages-dist/bundles/database-deprecated.umd.{js,map}',
      'dist/packages-dist/bundles/test.umd.{js,map}',
    ],

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    reporters: ['mocha'],
    browsers: ['ChromeHeadless'],
    singleRun: false,
    customLaunchers: {
      ChromeHeadlessTravis: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },
  })
};

function getAngularFiles(packages) {
  return packages.reduce((files, pkg) => {
    files.push(`node_modules/@angular/${pkg}/bundles/${pkg}.umd.js`);
    files.push(`node_modules/@angular/${pkg}/bundles/${pkg}-testing.umd.js`);
    return files;
  }, []);
}
