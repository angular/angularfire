import { NgModule } from '@angular/core';
import { AngularFireDatabase, RealtimeDatabaseURL } from './database';
import '@firebase/database';

@NgModule({
  providers: [ AngularFireDatabase ]
})
export class AngularFireDatabaseModule { }
