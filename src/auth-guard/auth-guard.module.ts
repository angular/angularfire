import { NgModule } from '@angular/core';
import { AngularFireAuthGuard } from './auth-guard';

@NgModule({
  providers: [ AngularFireAuthGuard ]
})
export class AngularFireAuthGuardModule { }
