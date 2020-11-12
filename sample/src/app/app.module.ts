import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { isDevMode, NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

import { AngularFireModule } from '@angular/fire';

import {
  AngularFireAnalyticsModule,
  DEBUG_MODE as ANALYTICS_DEBUG_MODE,
  ScreenTrackingService,
  UserTrackingService
} from '@angular/fire/analytics';

import { FirestoreComponent } from './firestore/firestore.component';
import { AngularFireDatabaseModule, USE_EMULATOR as USE_DATABASE_EMULATOR } from '@angular/fire/database';
import { AngularFirestoreModule, USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireAuthModule, USE_DEVICE_LANGUAGE, USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/auth';
import { AngularFireMessagingModule, SERVICE_WORKER, VAPID_KEY } from '@angular/fire/messaging';
import { AngularFireFunctionsModule, USE_EMULATOR as USE_FUNCTIONS_EMULATOR, ORIGIN as FUNCTIONS_ORIGIN } from '@angular/fire/functions';
import { AngularFireRemoteConfigModule, SETTINGS as REMOTE_CONFIG_SETTINGS, DEFAULTS as REMOTE_CONFIG_DEFAULTS } from '@angular/fire/remote-config';
import { AngularFirePerformanceModule, PerformanceMonitoringService } from '@angular/fire/performance';
import { AngularFireAuthGuardModule } from '@angular/fire/auth-guard';
import { DatabaseComponent } from './database/database.component';
import { StorageComponent } from './storage/storage.component';
import { RemoteConfigComponent } from './remote-config/remote-config.component';
import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { MessagingComponent } from './messaging/messaging.component';

const shouldUseEmulator = () => false;

@NgModule({
  declarations: [
    AppComponent,
    StorageComponent,
    FirestoreComponent,
    DatabaseComponent,
    RemoteConfigComponent,
    HomeComponent,
    AuthComponent,
    MessagingComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserTransferStateModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireStorageModule,
    AngularFireDatabaseModule,
    AngularFirestoreModule.enablePersistence({ synchronizeTabs: true }),
    AngularFireAuthModule,
    AngularFireRemoteConfigModule,
    AngularFireMessagingModule,
    // AngularFireAnalyticsModule, // TODO having trouble getting this to work in IE
    AngularFireFunctionsModule,
    // AngularFirePerformanceModule, // TODO having trouble getting this to work in IE
    AngularFireAuthGuardModule
  ],
  providers: [
    /*
      TODO Analytics and Performance monitoring aren't working in IE, sort this out
      UserTrackingService,
      ScreenTrackingService,
      PerformanceMonitoringService,
      {
        provide: ANALYTICS_DEBUG_MODE,
        useFactory: () => isDevMode()
      },
    */
    { provide: USE_AUTH_EMULATOR, useFactory: () => shouldUseEmulator() ? 'http://localhost:4000' : undefined },
    { provide: USE_DATABASE_EMULATOR, useFactory: () => shouldUseEmulator() ? ['localhost', 9000] : undefined },
    { provide: USE_FIRESTORE_EMULATOR, useFactory: () => shouldUseEmulator() ? ['localhost', 8080] : undefined },
    { provide: USE_FUNCTIONS_EMULATOR, useFactory: () => shouldUseEmulator() ? ['localhost', 9999] : undefined },
    { provide: FUNCTIONS_ORIGIN, useFactory: () => isDevMode() ? location.origin : undefined },
    { provide: REMOTE_CONFIG_SETTINGS, useFactory: () => isDevMode() ? { minimumFetchIntervalMillis: 10_000 } : {} },
    { provide: REMOTE_CONFIG_DEFAULTS, useValue: { background_color: 'red' } },
    { provide: USE_DEVICE_LANGUAGE, useValue: true },
    { provide: VAPID_KEY, useValue: environment.vapidKey },
    { provide: SERVICE_WORKER, useFactory: () => navigator?.serviceWorker?.getRegistration() ?? undefined },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
