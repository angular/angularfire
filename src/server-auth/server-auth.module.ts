import { NgModule } from '@angular/core';
import { AngularFireServerAuth } from './server-auth';

import 'firebase/auth';

@NgModule({
  providers: [ AngularFireServerAuth ]
})
export class AngularFireServerAuthModule { }
