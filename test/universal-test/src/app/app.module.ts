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
      apiKey: "AIzaSyDFbuKX0UeXje-PRAvwIymYo2jk-uGqMa4",
      authDomain: "test-bc800.firebaseapp.com",
      databaseURL: "https://test-bc800.firebaseio.com",
      storageBucket: ""
    }),
  ],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})

export class AppModule { }
