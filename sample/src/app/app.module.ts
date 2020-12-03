import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { isDevMode, NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

import { AngularFireModule, FIREBASE_APP_NAME } from '@angular/fire';

import {
  AngularFireAnalyticsModule,
  APP_NAME,
  APP_VERSION,
  DEBUG_MODE as ANALYTICS_DEBUG_MODE,
  ScreenTrackingService,
  UserTrackingService,
  COLLECTION_ENABLED
} from '@angular/fire/analytics';

import {
  AngularFireAuthModule,
  USE_DEVICE_LANGUAGE,
  USE_EMULATOR as USE_AUTH_EMULATOR,
  EXPERIMENTAL_COOKIE_AUTH
} from '@angular/fire/auth';

import { FirestoreComponent } from './firestore/firestore.component';
import { AngularFireDatabaseModule, USE_EMULATOR as USE_DATABASE_EMULATOR } from '@angular/fire/database';
import { AngularFirestoreModule, USE_EMULATOR as USE_FIRESTORE_EMULATOR, SETTINGS as FIRESTORE_SETTINGS } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireMessagingModule, SERVICE_WORKER, VAPID_KEY } from '@angular/fire/messaging';
import { AngularFireFunctionsModule, USE_EMULATOR as USE_FUNCTIONS_EMULATOR, ORIGIN as FUNCTIONS_ORIGIN, NEW_ORIGIN_BEHAVIOR } from '@angular/fire/functions';
import { AngularFireRemoteConfigModule, SETTINGS as REMOTE_CONFIG_SETTINGS, DEFAULTS as REMOTE_CONFIG_DEFAULTS } from '@angular/fire/remote-config';
import { AngularFirePerformanceModule, PerformanceMonitoringService } from '@angular/fire/performance';
import { AngularFireAuthGuardModule } from '@angular/fire/auth-guard';
import { DatabaseComponent } from './database/database.component';
import { StorageComponent } from './storage/storage.component';
import { RemoteConfigComponent } from './remote-config/remote-config.component';
import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { MessagingComponent } from './messaging/messaging.component';
import { FunctionsComponent } from './functions/functions.component';
import { FirestoreOfflineComponent } from './firestore-offline/firestore-offline.component';
import { FirestoreOfflineModule } from './firestore-offline/firestore-offline.module';
import { UpboatsComponent } from './upboats/upboats.component';

@NgModule({
  declarations: [
    AppComponent,
    StorageComponent,
    FirestoreComponent,
    FirestoreOfflineComponent,
    DatabaseComponent,
    RemoteConfigComponent,
    HomeComponent,
    AuthComponent,
    MessagingComponent,
    FunctionsComponent,
    UpboatsComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserTransferStateModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireStorageModule,
    AngularFireDatabaseModule,
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireAuthGuardModule,
    AngularFireRemoteConfigModule,
    AngularFireMessagingModule,
    AngularFireAnalyticsModule,
    AngularFireFunctionsModule,
    AngularFirePerformanceModule,
    FirestoreOfflineModule
  ],
  providers: [
    UserTrackingService,
    ScreenTrackingService,
    PerformanceMonitoringService,
    { provide: EXPERIMENTAL_COOKIE_AUTH, useValue: true },
    { provide: FIRESTORE_SETTINGS, useValue: { ignoreUndefinedProperties: true } },
    { provide: ANALYTICS_DEBUG_MODE, useFactory: isDevMode },
    { provide: COLLECTION_ENABLED, useValue: true },
    { provide: USE_AUTH_EMULATOR, useValue: environment.useEmulators ? ['localhost', 9099] : undefined },
    { provide: USE_DATABASE_EMULATOR, useValue: environment.useEmulators ? ['localhost', 9000] : undefined },
    { provide: USE_FIRESTORE_EMULATOR, useValue: environment.useEmulators ? ['localhost', 8080] : undefined },
    { provide: USE_FUNCTIONS_EMULATOR, useValue: environment.useEmulators ? ['localhost', 5001] : undefined },
    { provide: NEW_ORIGIN_BEHAVIOR, useValue: true },
    { provide: FUNCTIONS_ORIGIN, useFactory: () => isDevMode() || typeof location === 'undefined' ? undefined : location.origin },
    { provide: REMOTE_CONFIG_SETTINGS, useFactory: () => isDevMode() ? { minimumFetchIntervalMillis: 10_000 } : {} },
    { provide: REMOTE_CONFIG_DEFAULTS, useValue: { background_color: 'red' } },
    { provide: USE_DEVICE_LANGUAGE, useValue: true },
    { provide: VAPID_KEY, useValue: environment.vapidKey },
    { provide: SERVICE_WORKER, useFactory: () =>
      (typeof navigator !== 'undefined' && navigator.serviceWorker?.getRegistration()) ?? undefined
    },
    { provide: APP_VERSION, useValue: '0.0.0' },
    { provide: APP_NAME, useValue: 'Angular' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
