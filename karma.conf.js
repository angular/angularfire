// Karma configuration
// Generated on Wed Jan 20 2016 06:08:48 GMT-0800 (PST)

module.exports = function(config) {
  config.set({

    plugins: [
      require('./tools/test-server'),
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-systemjs')
    ],

    systemjs: {
      config: {
        map: {
          rxjs: 'node_modules/rxjs',
          angular2: 'node_modules/angular2',
          'zone.js': 'node_modules/zone.js/lib',
          firebase: 'node_modules/firebase/lib/firebase-web.js',
          'mock-promises': 'node_modules/mock-promises/lib/mock-promises.js',
          'reflect-metadata': 'node_modules/reflect-metadata/temp/Reflect.js',
          'mockfirebase': 'node_modules/mockfirebase/browser/mockfirebase.js'
        },
        packages: {
          'traceur': {
            defaultExtension: 'js'
          },
          'angular2': {
            defaultExtension: 'js'
          },
          'dist': {
            defaultExtension: 'js'
          },
          'zone.js': {
            defaultExtension: 'js'
          },
          'reflect-metadata': {
            format: 'global'
          },
          'rxjs': {
            main: 'Rx.js',
            defaultExtension: 'js'
          }
        }
      }
    },

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['systemjs', 'jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'node_modules/traceur/traceur.+(js|map)',
      {pattern: 'node_modules/systemjs/dist/**/*.map', included: false, watched: false},
      {pattern: 'node_modules/angular2/**/*.+(js|map)', included: false, watched: false},
      {pattern: 'node_modules/angular2/bundles/testing.dev.js', included: false, watched: false},
      {pattern: 'node_modules/reflect-metadata/**/*.+(js|map)', included: false, watched: false},
      {pattern: 'node_modules/reflect-metadata/temp/Reflect.js', included: true, watched: false},
      {pattern: 'node_modules/zone.js/lib/**/*.js', included: false, watched: false},
      'node_modules/zone.js/lib/zone.js',
      {pattern: 'karma-test-shim.js', included: true, watched: true},
      {pattern: 'node_modules/rxjs/**/*.+(js|map)', included: false, watched: false},
      {pattern: 'node_modules/firebase/lib/firebase-web.js', included: false, watched: false},
      {pattern: 'node_modules/mock-promises/lib/mock-promises.js', included: false, watched: false},
      {pattern: 'node_modules/mockfirebase/browser/mockfirebase.js', included: false, watched: false},
      {pattern: 'dist/**/*.js', included: false, watched: true},
      {pattern: 'src/**/*.ts', included: false, watched: false},
      'dist/**/*.spec.js',
      'dist/*.spec.js',
      {pattern: 'dist/**/*.js.map', included: false, watched: false},
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
