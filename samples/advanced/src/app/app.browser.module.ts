import { NgModule } from '@angular/core';
import { getAnalytics, provideAnalytics } from '@angular/fire/analytics';
import { getApp } from '@angular/fire/app';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getRemoteConfig, provideRemoteConfig } from '@angular/fire/remote-config';

import { provideAuth } from '@angular/fire/auth';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

import { browserPopupRedirectResolver, indexedDBLocalPersistence, initializeAuth } from '@angular/fire/auth';
import { connectAuthEmulatorInDevMode } from './emulators';

@NgModule({
  imports: [
    AppModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
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
  ],
  bootstrap: [AppComponent],
})
export class AppBrowserModule {}
