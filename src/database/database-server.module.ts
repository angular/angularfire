import { NgModule } from '@angular/core';
import { AngularFireDatabase } from './database';
import '@firebase/database';

@NgModule({
  providers: [ AngularFireDatabase ]
})
export class AngularFireDatabaseServerModule { }
