import { NgModule } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/messaging';
import { FirebaseApp } from '../app/index';
import { AngularFireModule } from '../angularfire2';
import { AngularFireMessaging } from './messaging';

export function _getAngularFireMessaging(app: FirebaseApp) {
  return new AngularFireMessaging(app);
}

export const AngularFireMessagingProvider = {
  provide: AngularFireMessaging,
  useFactory: _getAngularFireMessaging,
  deps: [ FirebaseApp ]
};

export const MESSAGING_PROVIDERS = [
  AngularFireMessagingProvider,
];

@NgModule({
  imports: [ AngularFireModule ],
  providers: [ MESSAGING_PROVIDERS ]
})
export class AngularFireMessagingModule { }
