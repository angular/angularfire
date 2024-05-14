import { NgModule } from '@angular/core';
import { VERSION } from '@angular/fire';
import firebase from 'firebase/compat/app';
import { AngularFireAuth } from './auth';

@NgModule({
  providers: [ AngularFireAuth ]
})
export class AngularFireAuthModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'auth-compat');
  }
}
