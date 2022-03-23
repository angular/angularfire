import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

import * as firebase from 'firebase/app';
import * as appCheck from 'firebase/app-check';
import * as analytics from 'firebase/analytics';
import * as auth from 'firebase/auth';
import * as database from 'firebase/database';
import * as firestore from 'firebase/firestore';
import * as functions from 'firebase/functions';
import * as performance from 'firebase/performance';
import * as remoteConfig from 'firebase/remote-config';
import * as storage from 'firebase/storage';

import * as firebaseCompat from 'firebase/compat/app';
import * as appCheckCompat from 'firebase/compat/app-check';
import * as analyticsCompat from 'firebase/compat/analytics';
import * as authCompat from 'firebase/compat/auth';
import * as databaseCompat from 'firebase/compat/database';
import * as firestoreCompat from 'firebase/compat/firestore';
import * as functionsCompat from 'firebase/compat/functions';
import * as performanceCompat from 'firebase/compat/performance';
import * as remoteConfigCompat from 'firebase/compat/remote-config';
import * as storageCompat from 'firebase/compat/storage';

console.log(Object.keys({
  firebase, appCheck, analytics, auth, database,
  firestore, functions, performance, remoteConfig, storage,
  firebaseCompat, appCheckCompat, analyticsCompat, authCompat,
  databaseCompat, firestoreCompat, functionsCompat, performanceCompat,
  remoteConfigCompat, storageCompat,
}));

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
