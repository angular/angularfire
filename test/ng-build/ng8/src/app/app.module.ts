import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { FirebaseApp, AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { AngularFirePerformanceModule, AUTOMATICALLY_TRACE_CORE_NG_METRICS } from '@angular/fire/performance';
import { AngularFireAuthGuardModule } from '@angular/fire/auth-guard';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp({
      apiKey: "AIzaSyAwRrxjjft7KMdhwfLKPkd8PCBR3JFaLfo",
      authDomain: "angularfirestore.firebaseapp.com",
      databaseURL: "https://angularfirestore.firebaseio.com",
      projectId: "angularfirestore",
      storageBucket: "angularfirestore.appspot.com",
      messagingSenderId: "1039984584356"
    }),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireMessagingModule,
    AngularFireFunctionsModule,
    AngularFirePerformanceModule,
    AngularFireAuthGuardModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
