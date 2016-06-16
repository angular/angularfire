import {APP_INITIALIZER, Inject, Injectable, OpaqueToken, provide, Provider} from '@angular/core';
import {AngularFireAuth, firebaseAuthConfig, FirebaseAuth} from './providers/auth';
import { initializeApp } from 'firebase';
import {FirebaseListObservable} from './utils/firebase_list_observable';
import {FirebaseObjectObservable} from './utils/firebase_object_observable';
import {FirebaseListFactory, FirebaseListFactoryOpts} from './utils/firebase_list_factory';
import {
  FirebaseObjectFactoryOpts,
  FirebaseObjectFactory
} from './utils/firebase_object_factory';
import * as utils from './utils/utils';
import {FirebaseConfig, FirebaseApp} from './tokens';
import { FirebaseAppConfig } from './interfaces';
import {
  AuthBackend,
  AuthMethods,
  AuthProviders,
  FirebaseAuthState
} from './providers/auth_backend';
import {FirebaseSdkAuthBackend} from './providers/firebase_sdk_auth_backend';
import {FirebaseDatabase} from './database/database';

@Injectable()
export class AngularFire {
  list: (url:string, opts?:FirebaseListFactoryOpts) => FirebaseListObservable<any[]>;
  object: (url: string, opts?:FirebaseObjectFactoryOpts) => FirebaseObjectObservable<any>;
  constructor(
    @Inject(FirebaseConfig) private fbUrl:string,
    public auth: AngularFireAuth,
    public database: FirebaseDatabase) {}
}

export const COMMON_PROVIDERS: any[] = [
  provide(FirebaseApp, {
    useFactory: (config: FirebaseAppConfig) => {
      return initializeApp(config);
    },
    deps: [FirebaseConfig]}),
  // TODO: Deprecate
  provide(FirebaseAuth, {
    useExisting: AngularFireAuth
  }),
  AngularFireAuth,
  AngularFire,
  FirebaseDatabase,
];

function _getFirebase(url:string): Firebase {
  return new Firebase(url);
}

export const FIREBASE_PROVIDERS:any[] = [
  COMMON_PROVIDERS,
  provide(AuthBackend, {
    useFactory: (app: firebase.app.App) => new FirebaseSdkAuthBackend(app, false),
    deps: [FirebaseApp]
  })
];

/**
 * Used to define the default Firebase root location to be
 * used throughout an application.
 */
export const defaultFirebase = (config: FirebaseAppConfig): Provider => {
  // remove a trailing slash from the Database URL if it exists
  config.databaseURL = utils.stripTrailingSlash(config.databaseURL);
  return provide(FirebaseConfig, {
    useValue: config
  });
};

export {
  AngularFireAuth,
  // TODO: Deprecate
  FirebaseAuth,
  FirebaseDatabase,
  FirebaseListObservable,
  FirebaseObjectObservable,
  FirebaseListFactory,
  FirebaseObjectFactory,
  firebaseAuthConfig,
  FirebaseAuthState,
  AuthMethods,
  AuthProviders
}

export { FirebaseConfig, FirebaseApp, FirebaseAuthConfig, FirebaseRef, FirebaseUrl } from './tokens';
export { FirebaseAppConfig } from './interfaces';

// Helps Angular-CLI automatically add providers
export default {
  providers: FIREBASE_PROVIDERS
}
