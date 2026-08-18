import { NgModule } from '@angular/core';
import { VERSION } from '@angular/fire';
import firebase from 'firebase/compat/app';
import { AngularFireAuthGuard } from './auth-guard';

@NgModule({
  providers: [ AngularFireAuthGuard ]
})
export class AngularFireAuthGuardModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'auth-guard-compat');
  }
}
