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
  WindowLocation,
  FirebaseUserConfig
} from './tokens';
import {
  APP_INITIALIZER,
  Inject,
  Injectable,
  OpaqueToken,
  provide,
  NgModule,
  ModuleWithProviders
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

export function _getFirebase(config: FirebaseAppConfig): firebase.app.App {
  return initializeApp(config);
}

export function _getWindowLocation(){
  return window.location;
}

export function _getAuthBackend(app: firebase.app.App): FirebaseSdkAuthBackend {
  return new FirebaseSdkAuthBackend(app, false);
}

export function _getDefaultFirebase(config){
  // remove a trailing slash from the Database URL if it exists
  config.databaseURL = utils.stripTrailingSlash(config.databaseURL);
  return config;
}

export const COMMON_PROVIDERS: any[] = [
  // TODO: Deprecate
  { provide: FirebaseAuth,
    useExisting: AngularFireAuth
  },
  {
    provide: FirebaseApp,
    useFactory: _getFirebase,
    deps: [FirebaseConfig]
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
  static initializeApp(config: FirebaseAppConfig, authConfig?:FirebaseAppConfig): ModuleWithProviders {
    return {
		ngModule: AngularFireModule,
		providers: [
		  { provide: FirebaseUserConfig, useValue: config },
		  { provide: FirebaseConfig, useFactory: _getDefaultFirebase, deps: [FirebaseUserConfig] },
      firebaseAuthConfig(authConfig)
		]
	}
  }
}

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

export { FirebaseConfig, FirebaseApp, FirebaseAuthConfig, FirebaseRef, FirebaseUrl, FirebaseUserConfig } from './tokens';
export { FirebaseAppConfig } from './interfaces';
