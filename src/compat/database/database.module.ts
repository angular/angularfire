import { NgModule } from '@angular/core';
import { AngularFireDatabase } from './database';
import firebase from 'firebase/compat/app';
import { VERSION } from '@angular/fire';
import { FirebaseApp } from '@angular/fire/compat';

@NgModule({
  providers: [{
    provide: AngularFireDatabase,
    deps: [ FirebaseApp, ],
  }]
})
export class AngularFireDatabaseModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'rtdb-compat');
  }
}
