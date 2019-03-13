import { NgModule } from '@angular/core';
import { AngularFireFunctions } from './functions';
import 'firebase/functions'

@NgModule({
  providers: [ AngularFireFunctions ]
})
export class AngularFireFunctionsModule { }
