// @ts-ignore
import Jasmine from 'jasmine';

import 'reflect-metadata';
import 'zone.js';

import { getTestBed } from '@angular/core/testing';
import { platformServerTesting, ServerTestingModule } from '@angular/platform-server/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
    ServerTestingModule,
    platformServerTesting()
);

const tests = new Jasmine({});
tests.loadConfig({
    spec_dir: '.',
    spec_files: [
        'dist/out-tsc/jasmine/**/*.jasmine.js',
        'dist/out-tsc/jasmine/**/*.spec.js',
    ]
});

tests.execute();
