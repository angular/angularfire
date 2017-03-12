import * as firebase from 'firebase/app';
import * as utils from './utils';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts, FirebaseAppConfig } from './interfaces';
import { FirebaseAppName } from './tokens';
import { Injectable, OpaqueToken, NgModule, ModuleWithProviders } from '@angular/core';
import { FirebaseListObservable, FirebaseObjectObservable, FirebaseListFactory, FirebaseObjectFactory, AngularFireDatabase } from './database/index';

@Injectable()
export class AngularFire {
  constructor(public database: AngularFireDatabase) {}
}

export function _getFirebase(config: FirebaseAppConfig, appName?: string): FirebaseApp {
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

export const FirebaseAppConfigToken = new OpaqueToken('FirebaseAppConfigToken');

@Injectable()
export class FirebaseApp {
  name: string;
  options: {};
  auth: () => firebase.auth.Auth;
  database: () => firebase.database.Database;
  messaging: () => firebase.messaging.Messaging;
  storage: () => firebase.storage.Storage;
  delete: () => firebase.Promise<any>;
}

export function _getAngularFire(db: AngularFireDatabase) {
  return new AngularFire(db);
}

export function _getAngularFireDatabase(app: FirebaseApp) {
  return new AngularFireDatabase(app);
}

export const FirebaseAppProvider = {
  provide: FirebaseApp,
  useFactory: _getFirebase,
  deps: [ FirebaseAppConfigToken, FirebaseAppName ]
};

export const AngularFireDatabaseProvider = {
  provide: AngularFireDatabase,
  useFactory: _getAngularFireDatabase,
  deps: [ FirebaseApp ]
};

export const AngularFireProvider = {
  provide: AngularFire,
  useFactory: _getAngularFire,
  deps: [ AngularFireDatabase ]
};

export const FIREBASE_PROVIDERS:any[] = [
  FirebaseAppProvider,
  AngularFireDatabaseProvider,
  AngularFireProvider
];

export {
  AngularFireDatabase,
  FirebaseListObservable,
  FirebaseObjectObservable,
  FirebaseListFactory,
  FirebaseObjectFactory
}

export { FirebaseConfig, FirebaseAuthConfig, FirebaseRef, FirebaseUrl, FirebaseUserConfig } from './tokens';
export { FirebaseAppConfig } from './interfaces';

@NgModule({
  providers: [FIREBASE_PROVIDERS]
})
export class AngularFireModule {
  static initializeApp(config, authConfig?, appName?): ModuleWithProviders {
    return {
      ngModule: AngularFireModule,
      providers: [
        { provide: FirebaseAppConfigToken, useValue: config },
        { provide: FirebaseAppName, useValue: appName },
        FirebaseAppProvider,
      ]
    }
  }
}

