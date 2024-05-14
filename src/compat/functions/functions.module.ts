import { NgModule } from '@angular/core';
import { VERSION } from '@angular/fire';
import firebase from 'firebase/compat/app';
import { AngularFireFunctions } from './functions';

@NgModule({
  providers: [ AngularFireFunctions ]
})
export class AngularFireFunctionsModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'fn-compat');
  }
}
