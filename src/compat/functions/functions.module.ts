import { NgModule } from '@angular/core';
import { AngularFireFunctions } from './functions';
import firebase from 'firebase/compat/app';
import { VERSION } from '@angular/fire';

@NgModule({
  providers: [ AngularFireFunctions ]
})
export class AngularFireFunctionsModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'fn-compat');
  }
}
