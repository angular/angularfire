import { NgModule, NgZone } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import { FirebaseApp } from '../app/index';
import { AngularFireModule } from '../angularfire2';
import { AngularFireAuth } from './index';

export function _getAngularFireAuth(app: FirebaseApp) {
  return new AngularFireAuth(app);
}

export const AngularFireAuthProvider = {
  provide: AngularFireAuth,
  useFactory: _getAngularFireAuth,
  deps: [ FirebaseApp ]
};

export const AUTH_PROVIDERS = [
  AngularFireAuthProvider,
];

@NgModule({
  imports: [ AngularFireModule ],
  providers: [ AUTH_PROVIDERS ]
})
export class AngularFireAuthModule { }
