import { enableProdMode, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AppModule } from './app/app.module';
import { connectAuthEmulatorInDevMode } from './app/emulators';
import { getApp } from '@angular/fire/app';
import { provideAuth, initializeAuth, indexedDBLocalPersistence, browserPopupRedirectResolver } from '@angular/fire/auth';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';
import { provideRemoteConfig, getRemoteConfig } from '@angular/fire/remote-config';

if (environment.production) {
  enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
  bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(AppModule, ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production,
            registrationStrategy: 'registerWhenStable:30000'
        })),
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
    ]
})
  .catch(err => console.error(err));
});
