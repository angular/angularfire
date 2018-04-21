import { NgModule } from '@angular/core';
import { AngularFireDatabase } from './database';
import { TransferState } from '@angular/platform-browser';
import '@firebase/database';

@NgModule({
  providers: [ AngularFireDatabase, TransferState ]
})
export class AngularFireDatabaseModule { }
