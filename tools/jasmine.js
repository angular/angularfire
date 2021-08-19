Jasmine = require('jasmine');

require('reflect-metadata');
require('zone.js/dist/zone-node');
require('zone.js/dist/zone-testing');

const { getTestBed } = require('@angular/core/testing');
const { platformServerTesting, ServerTestingModule } = require('@angular/platform-server/testing');

global['globalThis'] = require('globalthis/polyfill')();

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
    ServerTestingModule,
    platformServerTesting()
);

jasmine = new Jasmine();
jasmine.loadConfig({
    spec_dir: '.',
    spec_files: [
        'dist/out-tsc/jasmine/**/*.jasmine.js',
        'dist/out-tsc/jasmine/**/*.spec.js'
    ]
});

jasmine.execute();