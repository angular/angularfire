import * as firebase from 'firebase/app';
import { FirebaseAppConfigToken, FirebaseApp, _firebaseAppFactory } from './app/index';
import { FirebaseAppConfig } from './app/interfaces';
import { FirebaseAppName } from './app/tokens';
import { Injectable, OpaqueToken, NgModule } from '@angular/core';

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
