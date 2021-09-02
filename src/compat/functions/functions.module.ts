import { NgModule } from '@angular/core';
import { AngularFireFunctions } from './functions';
import firebase from 'firebase/compat/app';
import { VERSION } from '@angular/fire';
import { FirebaseApp } from '@angular/fire/compat';

@NgModule({
  providers: [{
    provide: AngularFireFunctions,
    deps: [ FirebaseApp, ],
  }]
})
export class AngularFireFunctionsModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'fn-compat');
  }
}
