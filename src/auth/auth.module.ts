import { NgModule } from '@angular/core';
import { AngularFireAuth } from './auth';

import '@firebase/auth';

@NgModule({
  providers: [ AngularFireAuth ]
})
export class AngularFireAuthModule { }
