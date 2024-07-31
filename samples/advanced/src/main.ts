import {
  enableProdMode,
  mergeApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';

import { getAnalytics, provideAnalytics } from '@angular/fire/analytics';
import { getApp } from '@angular/fire/app';
import {
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  initializeAuth,
  provideAuth,
} from '@angular/fire/auth';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import {
  getRemoteConfig,
  provideRemoteConfig,
} from '@angular/fire/remote-config';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { connectAuthEmulatorInDevMode } from './app/emulators';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
  bootstrapApplication(
    AppComponent,
    mergeApplicationConfig(appConfig, {
      providers: [
        provideRemoteConfig(() => getRemoteConfig()),
        provideAnalytics(() => getAnalytics()),
        provideMessaging(() => getMessaging()),
        provideAuth(() => {
          const auth = initializeAuth(getApp(), {
            persistence: indexedDBLocalPersistence,
            popupRedirectResolver: browserPopupRedirectResolver,
          });
          connectAuthEmulatorInDevMode(auth);
          return auth;
        }),
        provideExperimentalZonelessChangeDetection(),
      ],
    })
  ).catch((err) => console.error(err));
});
