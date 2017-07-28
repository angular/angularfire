import * as firebase from 'firebase/app';
import { FirebaseAppConfigToken, FirebaseApp, _firebaseAppFactory } from './firebase.app.module';
import { Injectable, InjectionToken, OpaqueToken, NgModule } from '@angular/core';

export interface FirebaseAppConfig {
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  projectId?: string;
}

const FirebaseAppName = new InjectionToken<string>('FirebaseAppName');

export const FirebaseAppProvider = {
  provide: FirebaseApp,
  useFactory: _firebaseAppFactory,
  deps: [ FirebaseAppConfigToken, FirebaseAppName ]
};

@NgModule({
  providers: [ FirebaseAppProvider ],
})
export class AngularFireModule {
  static initializeApp(config: FirebaseAppConfig, appName?: string) {
    return {
      ngModule: AngularFireModule,
      providers: [
        { provide: FirebaseAppConfigToken, useValue: config },
        { provide: FirebaseAppName, useValue: appName }
      ]
    }
  }
}

export { FirebaseApp, FirebaseAppName, FirebaseAppConfigToken };
