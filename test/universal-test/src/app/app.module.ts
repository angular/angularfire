import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AppComponent }   from './app.component';

@NgModule({
  imports:      [
    BrowserModule.withServerTransition({appId: 'my-app'}),
    AngularFireDatabaseModule,
    AngularFireModule.initializeApp({
      apiKey: "AIzaSyBVSy3YpkVGiKXbbxeK0qBnu3-MNZ9UIjA",
      authDomain: "angularfire2-test.firebaseapp.com",
      databaseURL: "https://angularfire2-test.firebaseio.com",
      storageBucket: "angularfire2-test.appspot.com",
    }),
  ],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})

export class AppModule { }
