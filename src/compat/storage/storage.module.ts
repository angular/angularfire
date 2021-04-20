import { NgModule } from '@angular/core';
import { GetDownloadURLPipeModule } from './pipes/storageUrl.pipe';
import { AngularFireStorage } from './storage';

@NgModule({
  exports: [ GetDownloadURLPipeModule ],
  providers: [ AngularFireStorage ]
})
export class AngularFireStorageModule { }
