import { NgModule, InjectionToken } from '@angular/core';
import { AngularFireStorage } from './storage';

import '@firebase/storage';

@NgModule({
  providers: [ AngularFireStorage ]
})
export class AngularFireStorageModule { }
