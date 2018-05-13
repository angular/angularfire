import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FirebaseOptionsToken, AngularFireModule, FirebaseAppNameToken, FirebaseAppConfigToken } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFirestoreModule } from 'angularfire2/firestore';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AngularFireModule,
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFirestoreModule
  ],
  providers: [
    { provide: FirebaseOptionsToken, useValue: {
      apiKey: "AIzaSyAwRrxjjft7KMdhwfLKPkd8PCBR3JFaLfo",
      authDomain: "angularfirestore.firebaseapp.com",
      databaseURL: "https://angularfirestore.firebaseio.com",
      projectId: "angularfirestore",
      storageBucket: "angularfirestore.appspot.com",
      messagingSenderId: "1039984584356"
    } },
    { provide: FirebaseAppNameToken, useValue: undefined },
    { provide: FirebaseAppConfigToken, useValue: undefined }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
