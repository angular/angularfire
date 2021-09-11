import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { connectFunctionsEmulator, FunctionsModule, getFunctions, provideFunctions } from '@angular/fire/functions';
import { connectFirestoreEmulator, getFirestore, provideFirestore, enableMultiTabIndexedDbPersistence } from '@angular/fire/firestore';
import { connectDatabaseEmulator, getDatabase, provideDatabase } from '@angular/fire/database';
import { connectStorageEmulator, getStorage, provideStorage } from '@angular/fire/storage';

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
import { AppCheckComponent } from './app-check/app-check.component';

let resolvePersistenceEnabled: (enabled: boolean) => void;

export const persistenceEnabled = new Promise<boolean>(resolve => {
  resolvePersistenceEnabled = resolve;
});

@NgModule({
  declarations: [
    AppComponent,
    AppCheckComponent,
    HomeComponent,
    UpboatsComponent,
    AuthComponent,
    FirestoreComponent,
    DatabaseComponent,
    FunctionsComponent,
    MessagingComponent,
    RemoteConfigComponent,
    StorageComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    FunctionsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators) {
          connectFirestoreEmulator(firestore, 'localhost', 8080);
      }
      enableMultiTabIndexedDbPersistence(firestore).then(
        () => resolvePersistenceEnabled(true),
        () => resolvePersistenceEnabled(false)
      );
      return firestore;
    }),
    provideDatabase(() => {
      const database = getDatabase();
      if (environment.useEmulators) {
          connectDatabaseEmulator(database, 'localhost', 9000);
      }
      return database;
    }),
    provideStorage(() => {
      const storage = getStorage();
      if (environment.useEmulators) {
          connectStorageEmulator(storage, 'localhost', 9199);
      }
      return storage;
    }),
    provideFunctions(() => {
      const functions = getFunctions();
      if (environment.useEmulators) {
          connectFunctionsEmulator(functions, 'localhost', 5001);
      }
      return functions;
    }),
  ],
  providers: [ ],
  bootstrap: [ ],
})
export class AppModule { }
