import Jasmine from 'jasmine';

import 'zone.js/dist/zone-node';
import 'zone.js/dist/zone-testing';

import { getTestBed } from '@angular/core/testing';
import { platformServerTesting, ServerTestingModule } from '@angular/platform-server/testing';

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