import { NgModule } from '@angular/core';
import { AngularFireRemoteConfig } from './remote-config';
import firebase from 'firebase/compat/app';
import { VERSION } from '@angular/fire';
import { FirebaseApp } from '@angular/fire/compat';

@NgModule({
  providers: [{
    provide: AngularFireRemoteConfig,
    deps: [ FirebaseApp, ],
  }]
})
export class AngularFireRemoteConfigModule {
    constructor() {
        firebase.registerVersion('angularfire', VERSION.full, 'rc-compat');
    }
}
