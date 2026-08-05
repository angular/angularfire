// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import { provideZonelessChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { environment } from './environments/environment';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting()
);

// Setup Firebase for testing after test environment is initialized
getTestBed().configureTestingModule({
  providers: [
    provideZonelessChangeDetection(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
  ],
});
