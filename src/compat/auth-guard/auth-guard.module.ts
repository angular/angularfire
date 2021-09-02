import { NgModule } from '@angular/core';
import { AngularFireAuthGuard } from './auth-guard';
import firebase from 'firebase/compat/app';
import { VERSION } from '@angular/fire';

@NgModule({
  providers: [ AngularFireAuthGuard ]
})
export class AngularFireAuthGuardModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'auth-guard-compat');
  }
}
