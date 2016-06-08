import {Inject, Injectable} from '@angular/core';
import {FirebaseAuth, firebaseAuthConfig} from './providers/auth';
import * as Firebase from 'firebase';
import {FirebaseListObservable} from './utils/firebase_list_observable';
import {FirebaseObjectObservable} from './utils/firebase_object_observable';
import {FirebaseListFactory, FirebaseListFactoryOpts} from './utils/firebase_list_factory';
import {
  FirebaseObjectFactoryOpts,
  FirebaseObjectFactory
} from './utils/firebase_object_factory';
import {FirebaseUrl, FirebaseRef} from './tokens';
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
    @Inject(FirebaseUrl) private fbUrl:string,
    public auth:FirebaseAuth,
    public database: FirebaseDatabase) {}
}

export const COMMON_PROVIDERS: any[] = [
  { provide: FirebaseRef, useFactory: firebaseFactory, deps: [FirebaseUrl] },
  FirebaseAuth,
  AngularFire,
  FirebaseDatabase
];

export function firebaseFactory(url: string): Firebase {
  return new Firebase(url);
}

export const FIREBASE_PROVIDERS: any[] = [
  COMMON_PROVIDERS,
  { provide: AuthBackend, useFactory: authBackendFactory, deps: [FirebaseRef] }
];

export function authBackendFactory(ref: Firebase): FirebaseSdkAuthBackend {
  return new FirebaseSdkAuthBackend(ref, false);
}

/**
 * Used to define the default Firebase root location to be used throughout an application.
 */
export const defaultFirebase = (url: string): any => {
  return {provide: FirebaseUrl, useValue: url};
};

export {
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

export {FirebaseUrl, FirebaseRef, FirebaseAuthConfig} from './tokens';

// Helps Angular-CLI automatically add providers
export default {
  providers: FIREBASE_PROVIDERS
};

