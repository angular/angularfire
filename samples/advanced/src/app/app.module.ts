import { InjectionToken, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { FunctionsModule } from '@angular/fire/functions';
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider, CustomProvider } from '@angular/fire/app-check';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { HomeComponent } from './home/home.component';
import { UpboatsComponent } from './upboats/upboats.component';
import { AuthComponent } from './auth/auth.component';
import { FirestoreComponent } from './firestore/firestore.component';
import { DatabaseComponent } from './database/database.component';
import { FunctionsComponent } from './functions/functions.component';
import { MessagingComponent } from './messaging/messaging.component';
import { RemoteConfigComponent } from './remote-config/remote-config.component';
import { StorageComponent } from './storage/storage.component';

import type { app } from 'firebase-admin';
import { AppCheckComponent } from './app-check/app-check.component';

export const FIREBASE_ADMIN = new InjectionToken<app.App>('firebase-admin');

@NgModule({
  declarations: [
    AppComponent,
    AppCheckComponent,
    AuthComponent,
    DatabaseComponent,
    FirestoreComponent,
    FunctionsComponent,
    HomeComponent,
    MessagingComponent,
    RemoteConfigComponent,
    StorageComponent,
    UpboatsComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    FunctionsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAppCheck(() =>  {
      const provider = typeof process !== 'undefined' && process.versions?.node ?
        new CustomProvider({ getToken: () => Promise.reject() }) :
        new ReCaptchaV3Provider(environment.recaptcha3SiteKey);
      return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
    }),
  ],
  providers: [ ],
  bootstrap: [ ],
})
export class AppModule { }
