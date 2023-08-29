import { NgModule } from '@angular/core';
import { VERSION } from '@angular/fire';
import firebase from 'firebase/compat/app';
import { AngularFireMessaging } from './messaging';

@NgModule({
  providers: [ AngularFireMessaging ]
})
export class AngularFireMessagingModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'fcm-compat');
  }
}
