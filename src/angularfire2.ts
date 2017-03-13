import * as firebase from 'firebase/app';
import * as utils from './utils';
import { FirebaseAppConfigToken, FirebaseApp, _firebaseAppFactory } from './app/index';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts, FirebaseAppConfig } from './interfaces';
import { FirebaseAppName, WindowLocation, FirebaseAuthConfig } from './tokens';
import { Injectable, OpaqueToken, NgModule } from '@angular/core';
import { FirebaseSdkAuthBackend, AuthBackend, AngularFireAuth, AuthConfiguration } from './auth/index';

@Injectable()
export class AngularFire {
  constructor(
    public auth: AngularFireAuth) {}
}

export function _getAngularFire(auth: AngularFireAuth) {
  return new AngularFire(auth);
}

export function _getAngularFireAuth(backend: AuthBackend, location: any, config: any) {
  return new AngularFireAuth(backend, location, config);
}

export function _getWindowLocation(){
  return window.location;
}

export function _getFirebaseAuthBackend(app: FirebaseApp) {
  return new FirebaseSdkAuthBackend(app);
}

export const AuthBackendProvder = {
  provide: AuthBackend,
  useFactory: _getFirebaseAuthBackend,
  deps: [ FirebaseApp ]
};

export const WindowLocationProvider = {
  provide: WindowLocation,
  useFactory: _getWindowLocation
};

export const FirebaseAppProvider = {
  provide: FirebaseApp,
  useFactory: _firebaseAppFactory,
  deps: [ FirebaseAppConfigToken, FirebaseAppName ]
};

export const FirebaseAuthBackendProvider = {
  provide: FirebaseSdkAuthBackend,
  useFactory: _getFirebaseAuthBackend,
  deps: [ FirebaseApp ]
};

export const AngularFireAuthProvider = {
  provide: AngularFireAuth,
  useFactory: _getAngularFireAuth,
  deps: [ AuthBackend, WindowLocation, FirebaseAuthConfig ]
};

export const AngularFireProvider = {
  provide: AngularFire,
  useFactory: _getAngularFire,
  deps: [ AngularFireAuth ]
};

export const FIREBASE_PROVIDERS:any[] = [
  FirebaseAppProvider,
  FirebaseAuthBackendProvider,
  AuthBackendProvder,
  WindowLocationProvider,
  AngularFireAuthProvider,
  AngularFireProvider
];

export {
  FirebaseApp,
  FirebaseAppConfigToken,
  AngularFireAuth,
  WindowLocation
}

export { AuthMethods, firebaseAuthConfig, AuthProviders, FirebaseAuthState } from './auth/index';

export { FirebaseConfig, FirebaseAuthConfig, FirebaseRef, FirebaseUrl, FirebaseUserConfig } from './tokens';
export { FirebaseAppConfig } from './interfaces';

@NgModule({
  providers: [FIREBASE_PROVIDERS],
})
export class AngularFireModule {
  static initializeApp(config: FirebaseAppConfig, authConfig?: AuthConfiguration, appName?: string) {
    return {
      ngModule: AngularFireModule,
      providers: [
        { provide: FirebaseAppConfigToken, useValue: config },
        { provide: FirebaseAppName, useValue: appName },
        { provide: FirebaseAuthConfig, useValue: authConfig }
      ]
    }
  }
}
