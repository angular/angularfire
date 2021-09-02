import { NgModule } from '@angular/core';
import { AngularFireAuth } from './auth';
import firebase from 'firebase/compat/app';
import { VERSION } from '@angular/fire';
import { FirebaseApp } from '@angular/fire/compat';

@NgModule({
  providers: [{
    provide: AngularFireAuth,
    deps: [ FirebaseApp, ],
  }]
})
export class AngularFireAuthModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'auth-compat');
  }
}
