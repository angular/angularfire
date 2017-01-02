import * as firebase from 'firebase';
import * as utils from './utils';
import { FirebaseAppConfig } from './interfaces';
import { AuthConfiguration } from './auth';
import {
  FirebaseListFactoryOpts,
  FirebaseObjectFactoryOpts,
} from './interfaces';
import {
  FirebaseConfig,
  FirebaseApp,
  WindowLocation,
  FirebaseUserConfig,
  FirebaseAuthConfig,
  FirebaseAppName
} from './tokens';
import {
  APP_INITIALIZER,
  Inject,
  Injectable,
  OpaqueToken,
  NgModule,
  ModuleWithProviders
} from '@angular/core';
import {
  FirebaseSdkAuthBackend,
  AngularFireAuth,
  firebaseAuthConfig,
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
  AngularFireDatabase
} from './database/index';

@Injectable()
export class AngularFire {
  constructor(
    @Inject(FirebaseConfig) private firebaseConfig:FirebaseAppConfig,
    public auth: AngularFireAuth,
    public database: AngularFireDatabase) {}
}

export function _getFirebase(config: FirebaseAppConfig, appName?: string): firebase.app.App {
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

export function _getWindowLocation(){
  return window.location;
}

export function _getAuthBackend(app: firebase.app.App): FirebaseSdkAuthBackend {
  return new FirebaseSdkAuthBackend(app);
}

export function _getDefaultFirebase(config: FirebaseUserConfig) {
  // remove a trailing slash from the Database URL if it exists
  config.databaseURL = utils.stripTrailingSlash(config.databaseURL);
  return config;
}

export const COMMON_PROVIDERS: any[] = [
  {
    provide: FirebaseApp,
    useFactory: _getFirebase,
    deps: [FirebaseConfig, FirebaseAppName]
  },
  AngularFireAuth,
  AngularFire,
  AngularFireDatabase
];

export const FIREBASE_PROVIDERS:any[] = [
  COMMON_PROVIDERS,
  {
    provide: AuthBackend,
    useFactory: _getAuthBackend,
    deps: [FirebaseApp]
  },
  {
    provide: WindowLocation,
    useFactory: _getWindowLocation
  },
];

/**
 * Used to define the default Firebase root location to be
 * used throughout an application.
 */
export const defaultFirebase = (config: FirebaseAppConfig): any => {
  return [
    { provide: FirebaseUserConfig, useValue: config },
    { provide: FirebaseConfig, useFactory: _getDefaultFirebase, deps: [FirebaseUserConfig] }
  ]
};

@NgModule({
  providers: FIREBASE_PROVIDERS
})
export class AngularFireModule {
  static initializeApp(config: FirebaseAppConfig, authConfig?: AuthConfiguration, appName?: string): ModuleWithProviders {
    return {
      ngModule: AngularFireModule,
      providers: [
        { provide: FirebaseUserConfig, useValue: config },
        { provide: FirebaseConfig, useFactory: _getDefaultFirebase, deps: [FirebaseUserConfig] },
        { provide: FirebaseAuthConfig, useValue: authConfig },
        { provide: FirebaseAppName, useValue: appName }
      ]
    }
  }
}

export {
  AngularFireAuth,
  AngularFireDatabase,
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

export { FirebaseConfig, FirebaseApp, FirebaseAuthConfig, FirebaseRef, FirebaseUrl, FirebaseUserConfig } from './tokens';
export { FirebaseAppConfig } from './interfaces';
