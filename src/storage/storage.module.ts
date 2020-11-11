import { NgModule } from '@angular/core';
import { AngularFireStorage } from './storage';
import { AngularFirestoreStorageUrl } from './pipes/storageUrl.pipe';

@NgModule({
  declarations: [ AngularFirestoreStorageUrl ],
  providers: [ AngularFireStorage ]
})
export class AngularFireStorageModule { }
