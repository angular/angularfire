import { NgModule, NgZone } from '@angular/core';
import { FirebaseApp, AngularFireModule } from 'angularfire2';
import { AngularFirestore } from './firestore';

export function _getAngularFirestore(app: FirebaseApp) {
  return new AngularFirestore(app);
}

export const AngularFirestoreProvider = {
  provide: AngularFirestore,
  useFactory: _getAngularFirestore,
  deps: [ FirebaseApp ]
};

export const FIRESTORE_PROVIDERS = [
  AngularFirestoreProvider,
];

@NgModule({
  imports: [ AngularFireModule ],
  providers: [ FIRESTORE_PROVIDERS ]
})
export class AngularFirestoreModule { }
