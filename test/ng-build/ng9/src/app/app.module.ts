import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { FirebaseApp, AngularFireModule } from '@angular/fire/compat';
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFireMessagingModule } from '@angular/fire/compat/messaging';
import { AngularFireFunctionsModule } from '@angular/fire/compat/functions';
import { AngularFireRemoteConfigModule } from '@angular/fire/compat/remote-config';
import { AngularFirePerformanceModule, AUTOMATICALLY_TRACE_CORE_NG_METRICS } from '@angular/fire/compat/performance';
import { AngularFireAuthGuardModule } from '@angular/fire/auth-guard';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp({
      apiKey: 'AIzaSyBVSy3YpkVGiKXbbxeK0qBnu3-MNZ9UIjA',
      authDomain: 'angularfire2-test.firebaseapp.com',
      databaseURL: 'https://angularfire2-test.firebaseio.com',
      projectId: 'angularfire2-test',
      storageBucket: 'angularfire2-test.appspot.com',
      messagingSenderId: '920323787688',
      appId: '1:920323787688:web:2253a0e5eb5b9a8b',
      databaseName: 'angularfire2-test',
      measurementId: 'G-W20QDV5CZP'
    }),
    AngularFireAnalyticsModule,
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireMessagingModule,
    AngularFireFunctionsModule,
    AngularFireRemoteConfigModule,
    AngularFirePerformanceModule,
    AngularFireAuthGuardModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
