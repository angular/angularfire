import { NgModule, InjectionToken } from '@angular/core';
import { AngularFireStorage, StorageBucket } from './storage';
import '@firebase/storage';

@NgModule({
  providers: [ AngularFireStorage ]
})
export class AngularFireStorageModule { }
