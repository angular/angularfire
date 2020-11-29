import { NgModule } from '@angular/core';
import { GetDownloadURLPipeModule } from '@angular/fire/storage-lazy';
import { AngularFireStorage } from './storage';

@NgModule({
  exports: [ GetDownloadURLPipeModule ],
  providers: [ AngularFireStorage ]
})
export class AngularFireStorageModule { }
