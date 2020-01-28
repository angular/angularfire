Jasmine = require('jasmine');

jasmine = new Jasmine();
jasmine.loadConfig({
    spec_dir: '.',
    spec_files: [
        'dist/out-tsc/jasmine/**/*.jasmine.js',
        'dist/out-tsc/jasmine/**/*.spec.js'
    ]
});

require('reflect-metadata');
require('zone.js/dist/zone-node');
require('zone.js/dist/async-test');
require('zone.js/dist/sync-test');
require('zone.js/dist/fake-async-test');
require('zone.js/dist/proxy');
require('zone.js/dist/zone-patch-rxjs');
require('zone.js/dist/task-tracking');

const { getTestBed } = require('@angular/core/testing');
const { platformServerTesting, ServerTestingModule } = require('@angular/platform-server/testing');

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
    ServerTestingModule,
    platformServerTesting()
);

jasmine.execute();