import { NgModule, NgZone } from '@angular/core';
import { FirebaseApp, AngularFireModule } from 'angularfire2';
import { AngularFireAuth } from './auth';
import '@firebase/auth';

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
