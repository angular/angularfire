import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { FirebaseApp, initializeBrowserOrServerApp, provideFirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getPerformance, providePerformance } from '@angular/fire/performance';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    /* On the server, initializes a server app for the render when server.ts forwards the visitor's __session
     * cookie as the ID token (released once the render is garbage-collected). Otherwise initializes the ordinary app. */
    provideFirebaseApp(() => initializeBrowserOrServerApp(environment.firebase)),
    provideAuth(() => {
      const auth = getAuth(inject(FirebaseApp));
      if ((auth as any)._canInitEmulator && environment.emulatorPorts?.auth) {
        connectAuthEmulator(auth, `http://localhost:${environment.emulatorPorts.auth}`, { disableWarnings: true });
      }
      return auth;
    }),
    // Analytics with its two tracking services, Messaging and Performance: all five do nothing on the server.
    provideAnalytics(() => getAnalytics()),
    ScreenTrackingService,
    UserTrackingService,
    provideMessaging(() => getMessaging()),
    providePerformance(() => getPerformance()),
  ],
};
