import * as firebase from 'firebase/app';
import * as utils from './utils';
import { FirebaseAppConfigToken, FirebaseApp, _firebaseAppFactory } from './app/index';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts, FirebaseAppConfig } from './interfaces';
import { Injectable, InjectionToken, OpaqueToken, NgModule } from '@angular/core';

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

export { FirebaseApp, FirebaseAppName, FirebaseAppConfigToken, FirebaseAppConfig };
