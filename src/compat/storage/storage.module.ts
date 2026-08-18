import { NgModule } from '@angular/core';
import { VERSION } from '@angular/fire';
import firebase from 'firebase/compat/app';
import { GetDownloadURLPipeModule } from './pipes/storageUrl.pipe';
import { AngularFireStorage } from './storage';

@NgModule({
  imports: [ GetDownloadURLPipeModule ],
  exports: [ GetDownloadURLPipeModule ],
  providers: [ AngularFireStorage ]
})
export class AngularFireStorageModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'gcs-compat');
  }
}
