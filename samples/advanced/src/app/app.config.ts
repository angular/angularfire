import {
  ApplicationConfig,
  importProvidersFrom,
  InjectionToken,
  Optional,
} from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  CustomProvider,
  initializeAppCheck,
  provideAppCheck,
  ReCaptchaEnterpriseProvider,
} from '@angular/fire/app-check';
import { FunctionsModule } from '@angular/fire/functions';
import { BrowserModule } from '@angular/platform-browser';

import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';

import {
  ScreenTrackingService,
  UserTrackingService,
} from '@angular/fire/analytics';
import type { app } from 'firebase-admin';
import { zoneProviders } from './zone-providers';

export const FIREBASE_ADMIN = new InjectionToken<app.App>('firebase-admin');

export const appConfig: ApplicationConfig = {
  providers: [
    ...zoneProviders,
    importProvidersFrom([
      BrowserModule.withServerTransition({ appId: 'serverApp' }),
      AppRoutingModule,
      FunctionsModule,
    ]),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAppCheck(
      (injector) => {
        const admin = injector.get<app.App | null>(FIREBASE_ADMIN, null);
        if (admin) {
          const provider = new CustomProvider({
            getToken: () =>
              admin
                .appCheck()
                .createToken(environment.firebase.appId, {
                  ttlMillis: 604800000 /* 1 week */,
                })
                .then(({ token, ttlMillis: expireTimeMillis }) => ({
                  token,
                  expireTimeMillis,
                })),
          });
          return initializeAppCheck(undefined, {
            provider,
            isTokenAutoRefreshEnabled: false,
          });
        } else {
          const provider = new ReCaptchaEnterpriseProvider(
            environment.recaptcha3SiteKey
          );
          return initializeAppCheck(undefined, {
            provider,
            isTokenAutoRefreshEnabled: true,
          });
        }
      },
      [new Optional(), FIREBASE_ADMIN]
    ),
    ScreenTrackingService,
    UserTrackingService,
  ],
};
