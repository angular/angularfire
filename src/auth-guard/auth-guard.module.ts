import { NgModule } from '@angular/core';
import { AngularFireAuthGuard } from './auth-guard';
import { AngularFireAuthModule } from '@angular/fire/auth';

@NgModule({
  imports: [ AngularFireAuthModule ],
  providers: [ AngularFireAuthGuard ]
})
export class AngularFireAuthGuardModule { }
