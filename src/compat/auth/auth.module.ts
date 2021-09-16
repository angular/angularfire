import { NgModule } from '@angular/core';
import { AngularFireAuth } from './auth';
import firebase from 'firebase/compat/app';
import { VERSION } from '@angular/fire';

@NgModule({
  providers: [ AngularFireAuth ]
})
export class AngularFireAuthModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'auth-compat');
  }
}
