import { NgModule, InjectionToken } from '@angular/core';
import { AngularFireStorage, StorageBucket } from './storage';
import 'firebase/storage';
import { AngularFirestoreStorageUrl } from './pipes/storageUrl.pipe'


@NgModule({
  declarations: [ AngularFirestoreStorageUrl ],
  providers: [ AngularFireStorage ]
})
export class AngularFireStorageModule { }
