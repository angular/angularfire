import { NgModule } from '@angular/core';
import { VERSION } from '@angular/fire';
import firebase from 'firebase/compat/app';
import { AngularFireDatabase } from './database';

@NgModule({
  providers: [ AngularFireDatabase ]
})
export class AngularFireDatabaseModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'rtdb-compat');
  }
}
