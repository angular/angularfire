import {
  type ApplicationConfig,
  inject,
  provideZonelessChangeDetection,
} from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import {
  provideClientHydration,
  withIncrementalHydration,
} from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withIncrementalHydration()),
    provideAuth(() => {
      const auth = getAuth(inject(FirebaseApp));
      if ((auth as any)._canInitEmulator && environment.emulatorPorts?.auth) {
        connectAuthEmulator(
          auth,
          `http://localhost:${environment.emulatorPorts.auth}`,
          { disableWarnings: true }
        );
      }
      return auth;
    }),
  ],
};
