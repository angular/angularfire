import { NgModule } from '@angular/core';
import { AngularFireModule, FirebaseApp } from 'angularfire2';
import { AngularFireStorage } from './storage';
import '@firebase/storage';

export function _getAngularFireStorage(app: FirebaseApp) {
  return new AngularFireStorage(app);
}

export const AngularFireStorageProvider = {
  provide: AngularFireStorage,
  useFactory: _getAngularFireStorage,
  deps: [ FirebaseApp ]
};

export const STORAGE_PROVIDERS = [
  AngularFireStorageProvider,
];

@NgModule({
  imports: [ AngularFireModule ],
  providers: [ STORAGE_PROVIDERS ]
})
export class AngularFireStorageModule { }
