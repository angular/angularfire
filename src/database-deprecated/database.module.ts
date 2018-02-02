import { NgModule } from '@angular/core';
import { FirebaseApp } from '@firebase/app-types';
import { AngularFireDatabase } from './database';
import '@firebase/database';

@NgModule({
  providers: [ AngularFireDatabase ]
})
export class AngularFireDatabaseModule { }
