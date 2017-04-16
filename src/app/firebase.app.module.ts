import { Injectable, Inject, InjectionToken, NgModule, ModuleWithProviders } from '@angular/core';
import * as firebase from 'firebase/app';

export const FirebaseAppConfigToken = new InjectionToken('FirebaseAppConfigToken');

export class FirebaseApp implements firebase.app.App {
  name: string;
  options: {};
  auth: () => firebase.auth.Auth;
  database: () => firebase.database.Database;
  messaging: () => firebase.messaging.Messaging;
  storage: () => firebase.storage.Storage;
  delete: () => firebase.Promise<any>;
}

export function _firebaseAppFactory(config: {}, appName?: string): FirebaseApp {
  try {
    if (appName) {
      return firebase.initializeApp(config, appName);
    } else {
      return firebase.initializeApp(config);
    }
  }
  catch (e) {
    return firebase.app(null);
  }
}

export const FirebaseAppProvider = {
  provide: FirebaseApp,
  useFactory: _firebaseAppFactory,
  deps: [ FirebaseAppConfigToken ]
};

@NgModule({
  providers: [FirebaseAppProvider]
})
export class FirebaseAppModule {
  static initializeApp(config): ModuleWithProviders {
    return {
      ngModule: FirebaseAppModule,
      providers: [
        { provide: FirebaseAppConfigToken, useValue: config },
        FirebaseAppProvider,
      ]
    }
  }
}
