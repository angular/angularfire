import { NgModule, OpaqueToken } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/database';
import { FirebaseApp } from '../app/index';
import { AngularFireModule } from '../angularfire2';
import { AngularFireDatabase } from './index';
import { UnwrappedSnapshot, UnwrapSnapshotSignature } from './interfaces';
import { UnwrapSnapshotToken } from './tokens';
import { unwrapSnapshot } from './unwrap_snapshot';

export function _getAngularFireDatabase(app: FirebaseApp, unwrapSnapshot: UnwrapSnapshotSignature) {
  return new AngularFireDatabase(app, unwrapSnapshot);
}

export const AngularFireDatabaseProvider = {
  provide: AngularFireDatabase,
  useFactory: _getAngularFireDatabase,
  deps: [ FirebaseApp, UnwrapSnapshotToken ]
};

export const UnwrapSnapshotProvider = {
  provide: UnwrapSnapshotToken,
  useValue: unwrapSnapshot
};

export const DATABASE_PROVIDERS = [
  UnwrapSnapshotProvider,
  AngularFireDatabaseProvider
];

@NgModule({
  imports: [ AngularFireModule ],
  providers: [ DATABASE_PROVIDERS ]
})
export class AngularFireDatabaseModule { }
