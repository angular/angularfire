import { NgModule } from '@angular/core';
import { AngularFireDatabase } from './database';
import firebase from 'firebase/compat/app';
import { VERSION } from '@angular/fire';

@NgModule({
  providers: [ AngularFireDatabase ]
})
export class AngularFireDatabaseModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'rtdb-compat');
  }
}
