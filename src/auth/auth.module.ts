import { NgModule } from '@angular/core';
import { AngularFireAuth } from './auth';
import '@firebase/auth';
import { FirebaseApp } from '@firebase/app-types'

@NgModule({
  providers: [ AngularFireAuth ]
})
export class AngularFireAuthModule { }
