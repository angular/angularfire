import { NgModule } from '@angular/core';
import { AngularFireModule, FirebaseApp } from 'angularfire2';
import { AngularFireMessaging } from './messaging';
import '@firebase/storage';

export function _getAngularFireMessaging(app: FirebaseApp) {
  return new AngularFireMessaging(app);
}

export const AngularFireMessagingProvider = {
  provide: AngularFireMessaging,
  useFactory: _getAngularFireMessaging,
  deps: [ FirebaseApp ]
};

export const STORAGE_PROVIDERS = [
  AngularFireMessagingProvider,
];

@NgModule({
  imports: [ AngularFireModule ],
  providers: [ STORAGE_PROVIDERS ]
})
export class AngularFireMessagingModule { }
