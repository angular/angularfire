/*global jasmine, __karma__, window*/
Error.stackTraceLimit = Infinity;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

ng.core.testing.TestBed.initTestEnvironment(
  ng.platformBrowserDynamic.testing.BrowserDynamicTestingModule,
  ng.platformBrowserDynamic.testing.platformBrowserDynamicTesting()
);
