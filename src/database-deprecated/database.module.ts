import { NgModule } from '@angular/core';
import { AngularFireModule } from 'angularfire2';
import { FirebaseApp } from '@firebase/app-types';
import { AngularFireDatabase } from './database';
import '@firebase/database';

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
