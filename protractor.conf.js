// An example configuration file.
exports.config = {
  baseUrl: 'http://localhost:8080/test/e2e/',

  directConnect: true,
  seleniumAddress: 'http://localhost:4444/wd/hub',
  // seleniumServerJar: 'node_modules/protractor/selenium/selenium-server-standalone-2.48.2.jar',
  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },

  // Framework to use. Jasmine is recommended.
  framework: 'jasmine',

  // Spec patterns are relative to the current working directly when
  // protractor is called.
  specs: ['test/e2e/**/*.spec.js'],
  allScriptsTimeout: 110000,

  onPrepare: function() {
    browser.ignoreSynchronization = true;
  },
  // Options to be passed to Jasmine.
  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};
