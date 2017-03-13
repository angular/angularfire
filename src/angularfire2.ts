import * as firebase from 'firebase/app';
import * as utils from './utils';
import { FirebaseAppConfigToken, FirebaseApp, _firebaseAppFactory } from './app/index';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts, FirebaseAppConfig } from './interfaces';
import { FirebaseAppName } from './tokens';
import { Injectable, OpaqueToken, NgModule } from '@angular/core';
import { FirebaseSdkAuthBackend, AuthBackend, AngularFireAuth, AuthConfiguration } from './auth/index';

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

export { FirebaseApp, FirebaseAppConfigToken, FirebaseAppConfig }
