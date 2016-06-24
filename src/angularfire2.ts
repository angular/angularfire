import { initializeApp } from 'firebase';
import * as utils from './utils';
import { FirebaseAppConfig } from './interfaces';
import { 
  FirebaseListFactoryOpts, 
  FirebaseObjectFactoryOpts,
} from './interfaces';
import {
  FirebaseConfig,
  FirebaseApp,
  WindowLocation
} from './tokens';
import { 
  APP_INITIALIZER, 
  Inject, 
  Injectable, 
  OpaqueToken, 
  provide, 
  Provider 
} from '@angular/core';
import { 
  FirebaseSdkAuthBackend,
  AngularFireAuth, 
  firebaseAuthConfig, 
  FirebaseAuth,
  AuthBackend,
  AuthMethods,
  AuthProviders,
  FirebaseAuthState    
} from './auth/index';
import {
  FirebaseListObservable,
  FirebaseObjectObservable,
  FirebaseListFactory,
  FirebaseObjectFactory,
  AngularFireDatabase,
  FirebaseDatabase
} from './database/index';

@Injectable()
export class AngularFire {
  constructor(
    @Inject(FirebaseConfig) private fbUrl:string,
    public auth: AngularFireAuth,
    public database: AngularFireDatabase) {}
}

export const COMMON_PROVIDERS: any[] = [
  // TODO: Deprecate
  provide(FirebaseAuth, {
    useExisting: AngularFireAuth
  }),
  {
    provide: FirebaseApp,
    useFactory: _getFirebase,
    deps: [FirebaseConfig]
  },
  AngularFireAuth,
  AngularFire,
  AngularFireDatabase,
];

function _getFirebase(config: FirebaseAppConfig): firebase.app.App {
  return initializeApp(config);
}

export const FIREBASE_PROVIDERS:any[] = [
  COMMON_PROVIDERS,
  {
    provide: AuthBackend,
    useFactory: _getAuthBackend,
    deps: [FirebaseApp]
  },
  {
    provide: WindowLocation,
    useValue: window.location
  },
];

function _getAuthBackend(app: firebase.app.App): FirebaseSdkAuthBackend {
  return new FirebaseSdkAuthBackend(app, false);
}

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
  AngularFireDatabase,
  // TODO: Deprecate
  FirebaseAuth,
  // TODO: Deprecate
  FirebaseDatabase,
  FirebaseListObservable,
  FirebaseObjectObservable,
  FirebaseListFactory,
  FirebaseObjectFactory,
  firebaseAuthConfig,
  FirebaseAuthState,
  AuthMethods,
  AuthProviders,
  WindowLocation
}

export { FirebaseConfig, FirebaseApp, FirebaseAuthConfig, FirebaseRef, FirebaseUrl } from './tokens';
export { FirebaseAppConfig } from './interfaces';

// Helps Angular-CLI automatically add providers
export default {
  providers: FIREBASE_PROVIDERS
}
