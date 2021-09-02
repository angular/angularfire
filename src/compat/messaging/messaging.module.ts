import { NgModule } from '@angular/core';
import { AngularFireMessaging } from './messaging';
import firebase from 'firebase/compat/app';
import { VERSION } from '@angular/fire';
import { FirebaseApp } from '@angular/fire/compat';

@NgModule({
  providers: [{
    provide: AngularFireMessaging,
    deps: [ FirebaseApp, ],
  }]
})
export class AngularFireMessagingModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'fcm-compat');
  }
}
