import { ApplicationConfig, inject, InjectionToken, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { provideClientHydration, withIncrementalHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import type { App as FirebaseAdminAppInterface } from "firebase-admin/app";

import { routes } from './app.routes';
import { FirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';

export const FirebaseAdminApp = new InjectionToken<FirebaseAdminAppInterface>("firebase-admin");

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withIncrementalHydration()),
    provideAuth(() => {
      const auth = getAuth(inject(FirebaseApp));
      if ((auth as any)._canInitEmulator && environment.emulatorPorts?.auth) {
        connectAuthEmulator(auth, `http://localhost:${environment.emulatorPorts.auth}`, { disableWarnings: true });
      }
      return auth;
    }),
  ],
};
