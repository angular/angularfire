import { NgModule } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/database';
import { FirebaseApp } from '../app/index';
import { AngularFireModule } from '../angularfire2';
import { AngularFireDatabase } from './index';

export function _getAngularFireDatabase(app: FirebaseApp) {
  return new AngularFireDatabase(app);
}

export const AngularFireDatabaseProvider = {
  provide: AngularFireDatabase,
  useFactory: _getAngularFireDatabase,
  deps: [ FirebaseApp ]
};

export const DATABASE_PROVIDERS = [
  AngularFireDatabaseProvider,
];

@NgModule({
  imports: [ AngularFireModule ],
  providers: [ DATABASE_PROVIDERS ]
})
export class AngularFireDatabaseModule { }
