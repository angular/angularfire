import { NgModule } from '@angular/core';
import { getRemoteConfig, provideRemoteConfig } from '@angular/fire/remote-config';
import { getAnalytics, provideAnalytics } from '@angular/fire/analytics';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getApp } from '@angular/fire/app';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { provideAuth, connectAuthEmulator } from '@angular/fire/auth';

import { initializeAuth, browserPopupRedirectResolver, indexedDBLocalPersistence } from '@angular/fire/auth';

@NgModule({
  imports: [
    AppModule,
    provideRemoteConfig(() => getRemoteConfig()),
    provideAnalytics(() => getAnalytics()),
    provideMessaging(() => getMessaging()),
    provideAuth(() => {
      const auth = initializeAuth(getApp(), {
        persistence: indexedDBLocalPersistence,
        popupRedirectResolver: browserPopupRedirectResolver,
      });
      if (environment.useEmulators) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      }
      return auth;
    }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppBrowserModule {}
