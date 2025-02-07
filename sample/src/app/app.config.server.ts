import { mergeApplicationConfig, ApplicationConfig, inject, REQUEST_CONTEXT, NgZone } from '@angular/core';
import { initializeServerApp, provideFirebaseApp } from '@angular/fire/app';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRoutesConfig } from '@angular/ssr';
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";

import { appConfig, FirebaseAdminApp } from './app.config';
import { serverRoutes } from './app.routes.server';
import { environment } from '../environments/environment';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRoutesConfig(serverRoutes),
    {
      provide: FirebaseAdminApp,
      useFactory: () => {
        const ngZone = inject(NgZone);
        return ngZone.run(() =>
          ngZone.runOutsideAngular(() =>
            getApps().find(it => it.name === "[DEFAULT]") ||
            initializeApp({
              projectId: "web-frameworks-e2e",
              credential: applicationDefault(),
            })
          )
        )
      },
    },
    provideFirebaseApp(() => {
      // TODO migrate to REQUEST once that's working
      const requestContext = inject(REQUEST_CONTEXT, { optional: true }) as {
        authIdToken: string,
      } | undefined;
      const authIdToken = requestContext?.authIdToken;
      return initializeServerApp(environment.firebase, { authIdToken });
    }),
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
