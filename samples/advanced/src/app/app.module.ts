import { InjectionToken, NgModule, Optional } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { CustomProvider, ReCaptchaEnterpriseProvider, initializeAppCheck, provideAppCheck } from '@angular/fire/app-check';
import { FunctionsModule } from '@angular/fire/functions';
import { BrowserModule } from '@angular/platform-browser';

import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthComponent } from './auth/auth.component';
import { DatabaseComponent } from './database/database.component';
import { FirestoreComponent } from './firestore/firestore.component';
import { FunctionsComponent } from './functions/functions.component';
import { HomeComponent } from './home/home.component';
import { MessagingComponent } from './messaging/messaging.component';
import { RemoteConfigComponent } from './remote-config/remote-config.component';
import { StorageComponent } from './storage/storage.component';
import { UpboatsComponent } from './upboats/upboats.component';

import { ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import type { app } from 'firebase-admin';
import { AppCheckComponent } from './app-check/app-check.component';

export const FIREBASE_ADMIN = new InjectionToken<app.App>('firebase-admin');

// @ts-ignore
globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = "92efef26-9cb5-431b-80c3-8f405df341ad";

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
  ],
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAppCheck((injector) =>  {
      const admin = injector.get<app.App|null>(FIREBASE_ADMIN, null);
      if (admin) {
        const provider = new CustomProvider({ getToken: () =>
          admin.
          appCheck().
          createToken(environment.firebase.appId, { ttlMillis: 604_800_000, /* 1 week */ }).
          then(({ token, ttlMillis: expireTimeMillis }) => ({ token, expireTimeMillis } ))
        });
        return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: false });
      } else {
        const provider = new ReCaptchaEnterpriseProvider(environment.recaptcha3SiteKey);
        return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
      }
    }, [new Optional(), FIREBASE_ADMIN]),
    ScreenTrackingService,
    UserTrackingService,
  ],
  bootstrap: [ ],
})
export class AppModule { }
