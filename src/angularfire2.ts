import {Inject, Injectable, OpaqueToken, provide, Provider} from 'angular2/core';
import {FirebaseAuth} from './providers/auth';
import * as Firebase from 'firebase';
import {FirebaseListObservable} from './utils/firebase_list_observable';
import {FirebaseListFactory, FirebaseListFactoryOpts} from './utils/firebase_list_factory';
import {FirebaseUrl, FirebaseRef} from './tokens';

@Injectable()
export class AngularFire {
  constructor(
    @Inject(FirebaseUrl) private fbUrl:string,
    public auth:FirebaseAuth) {
  }
  list (url:string, opts?:FirebaseListFactoryOpts):FirebaseListObservable<any[]> {
    // TODO: check if relative or absolute
    return FirebaseListFactory(this.fbUrl+url, opts);
  }
}

export const FIREBASE_PROVIDERS:any[] = [
  provide(FirebaseRef, {
    useFactory: (url:string) => new Firebase(url),
    deps: [FirebaseUrl]}),
  FirebaseAuth,
  AngularFire
];

export const defaultFirebase = (url: string): Provider => {
  return provide(FirebaseUrl, {
    useValue: url
  });
};

export {FirebaseListObservable} from './utils/firebase_list_observable';
export {
  FirebaseAuth,
  FirebaseAuthState,
  AuthMethods,
  AuthProviders,
  firebaseAuthConfig
} from './providers/auth';
export {FirebaseUrl, FirebaseRef, FirebaseAuthConfig} from './tokens';

// Helps Angular-CLI automatically add providers
export default {
  providers: FIREBASE_PROVIDERS
}

