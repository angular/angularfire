import {
  type ApplicationConfig,
  REQUEST_CONTEXT,
  inject,
  mergeApplicationConfig,
} from '@angular/core';
import { initializeServerApp, provideFirebaseApp } from '@angular/fire/app';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { environment } from '../environments/environment';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideFirebaseApp(() => {
      // TODO migrate to REQUEST once that's working
      const requestContext = inject(REQUEST_CONTEXT, { optional: true }) as
        | {
            authIdToken: string;
          }
        | undefined;
      const authIdToken = requestContext?.authIdToken;
      return initializeServerApp(environment.firebase, { authIdToken });
    }),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
