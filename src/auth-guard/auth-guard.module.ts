import { NgModule } from '@angular/core';
import { AngularFireAuthGuard } from './auth-guard';
import { AngularFireAuth } from '@angular/fire/auth';

@NgModule({
  providers: [ AngularFireAuthGuard, AngularFireAuth ]
})
export class AngularFireAuthGuardModule { }
