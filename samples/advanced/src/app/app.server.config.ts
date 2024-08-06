import { provideServerRendering } from '@angular/platform-server';
import * as admin from 'firebase-admin';

import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { environment } from 'src/environments/environment';
import { appConfig, FIREBASE_ADMIN } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    {
      provide: FIREBASE_ADMIN,
      useFactory: () =>
        admin.apps[0] ||
        admin.initializeApp(
          // In Cloud Functions we can auto-initialize
          process.env.FUNCTION_NAME
            ? undefined
            : {
                credential: admin.credential.applicationDefault(),
                databaseURL: environment.firebase.databaseURL,
              }
        ),
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
