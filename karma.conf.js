const dns = require('node:dns');

// The emulator suite fails in CI, only on Node 18.
// This apparently fixes it.
// https://github.com/firebase/firebase-tools/issues/5755#issuecomment-1535445383
dns.setDefaultResultOrder('ipv4first');

let firestoreEmulatorPort, storageEmulatorPort, authEmulatorPort, databaseEmulatorPort, functionsEmulatorPort;
if (process.env.FIRESTORE_EMULATOR_HOST &&
    process.env.STORAGE_EMULATOR_HOST &&
    process.env.FIREBASE_AUTH_EMULATOR_HOST &&
    process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
      firestoreEmulatorPort = parseInt(process.env.FIRESTORE_EMULATOR_HOST.split(":")[1], 10); // '127.0.0.1:9098'
      storageEmulatorPort = parseInt(process.env.STORAGE_EMULATOR_HOST.split(":")[2], 10); // 'http://127.0.0.1:9199'
      authEmulatorPort = parseInt(process.env.FIREBASE_AUTH_EMULATOR_HOST.split(":")[1], 10); // '127.0.0.1:9098'
      databaseEmulatorPort = parseInt(process.env.FIREBASE_DATABASE_EMULATOR_HOST.split(":")[1], 10); // '127.0.0.1:9002'
      functionsEmulatorPort = 5001; // TODO figure out why this env variable isn't present
} else {
  console.error("Missing emulator environments variables");
  process.exit(1);
}

// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-safarinative-launcher'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      args: [
        ["FIRESTORE_EMULATOR_PORT", firestoreEmulatorPort],
        ["DATABASE_EMULATOR_PORT", databaseEmulatorPort],
        ["STORAGE_EMULATOR_PORT", storageEmulatorPort],
        ["AUTH_EMULATOR_PORT", authEmulatorPort],
        ["FUNCTIONS_EMULATOR_PORT", functionsEmulatorPort],
      ],
    },
    coverageIstanbulReporter: {
      dir: `${process.cwd()}/coverage`,
      reports: ['html', 'lcovonly'],
      fixWebpackSourcePaths: true
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome', 'ChromeHeadless', 'SafariNative', 'Firefox', 'FirefoxHeadless'],
    singleRun: false,
    restartOnFileChange: true,
    customLaunchers: {
      FirefoxHeadless: {
        base: 'Firefox',
        flags: [
          '-headless',
        ],
      }
    },
  });
};
