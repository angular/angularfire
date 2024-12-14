import { mergeApplicationConfig, ApplicationConfig, inject, REQUEST_CONTEXT } from '@angular/core';
import { initializeServerApp, provideFirebaseApp } from '@angular/fire/app';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRoutesConfig } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { environment } from '../environments/environment';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRoutesConfig(serverRoutes),
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
