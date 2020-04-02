import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { NgModule, isDevMode } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

import { AngularFireModule } from '@angular/fire';
import { AngularFireStorageModule } from '@angular/fire/storage';

import { AngularFireAnalyticsModule, UserTrackingService, ScreenTrackingService, DEBUG_MODE as ANALYTICS_DEBUG_MODE } from '@angular/fire/analytics';

import { FirestoreComponent } from './firestore/firestore.component';

import { AngularFireDatabaseModule, URL as DATABASE_URL } from '@angular/fire/database';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule, SETTINGS as FIRESTORE_SETTINGS } from '@angular/fire/firestore';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { AngularFireFunctionsModule, ORIGIN as FUNCTIONS_ORIGIN } from '@angular/fire/functions';
import { AngularFireRemoteConfigModule, SETTINGS as REMOTE_CONFIG_SETTINGS } from '@angular/fire/remote-config';
import { AngularFirePerformanceModule, PerformanceMonitoringService } from '@angular/fire/performance';
import { AngularFireAuthGuardModule } from '@angular/fire/auth-guard';
import { DatabaseComponent } from './database/database.component';
import { StorageComponent } from './storage/storage.component';
import { RemoteConfigComponent } from './remote-config/remote-config.component';

const shouldUseEmulator = () => false;

@NgModule({
  declarations: [ AppComponent, StorageComponent, FirestoreComponent, DatabaseComponent, RemoteConfigComponent ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserTransferStateModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireStorageModule,
    AngularFireAnalyticsModule,
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFirestoreModule.enablePersistence({ synchronizeTabs: true }),
    AngularFireMessagingModule,
    AngularFireFunctionsModule,
    AngularFireRemoteConfigModule,
    AngularFirePerformanceModule,
    AngularFireAuthGuardModule
  ],
  providers: [
    UserTrackingService,
    ScreenTrackingService,
    PerformanceMonitoringService,
    { provide: ANALYTICS_DEBUG_MODE,   useFactory: () => isDevMode() },
    { provide: DATABASE_URL,           useFactory: () => shouldUseEmulator() ? `http://localhost:9000?ns=${environment.firebase.projectId}` : undefined },
    { provide: FIRESTORE_SETTINGS,     useFactory: () => shouldUseEmulator() ? { host: 'localhost:8080', ssl: false } : {} },
    { provide: FUNCTIONS_ORIGIN,       useFactory: () => shouldUseEmulator() ? 'http://localhost:9999' : undefined },
    { provide: REMOTE_CONFIG_SETTINGS, useFactory: () => isDevMode() ? { minimumFetchIntervalMillis: 10_000 } : {} }
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
