import {OpaqueToken, provide, Provider} from 'angular2/core';
import {FirebaseAuth} from './providers/auth';
import * as Firebase from 'firebase';
import {FirebaseUrl, FirebaseRef} from './tokens';

export const FIREBASE_PROVIDERS:any[] = [
  provide(FirebaseRef, {
    useFactory: (url:string) => new Firebase(url),
    deps: [FirebaseUrl]}),
  FirebaseAuth
];

export const defaultFirebase = (url: string): Provider => {
  return provide(FirebaseUrl, {
    useValue: url
  });
};

export {FirebaseList, FirebaseListConfig} from './providers/firebase_list';
export {FirebaseObservable} from './utils/firebase_observable';
export {
  FirebaseAuth,
  FirebaseAuthState,
  FirebaseAuthDataGithub,
  AuthProviders
} from './providers/auth';
export {FirebaseUrl, FirebaseRef} from './tokens';

// Helps Angular-CLI automatically add providers
export default {
  providers: FIREBASE_PROVIDERS
}

