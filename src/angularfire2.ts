import {APP_INITIALIZER, Inject, Injectable, OpaqueToken, provide, Provider} from 'angular2/core';
import {FirebaseAuth} from './providers/auth';
import * as Firebase from 'firebase';
import {FirebaseListObservable} from './utils/firebase_list_observable';
import {FirebaseListFactory, FirebaseListFactoryOpts} from './utils/firebase_list_factory';
import {FirebaseUrl, FirebaseRef} from './tokens';
import {AuthBackend} from './providers/auth_backend';
import {FirebaseSdkAuthBackend} from './providers/firebase_sdk_auth_backend';
import {WebWorkerFirebaseAuth} from './providers/web_workers/worker/auth';
import {MessageBasedFirebaseAuth} from './providers/web_workers/ui/auth';

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

const COMMON_PROVIDERS: any[] = [
  provide(FirebaseRef, {
    useFactory: (url:string) => new Firebase(url),
    deps: [FirebaseUrl]}),
  FirebaseAuth,
  AngularFire
];

export const FIREBASE_PROVIDERS:any[] = [
  COMMON_PROVIDERS,
  provide(AuthBackend, {
    useFactory: (ref: Firebase) => new FirebaseSdkAuthBackend(ref, false),
    deps: [FirebaseRef]
  })
];

export const WORKER_APP_FIREBASE_PROVIDERS: any[] = [
  COMMON_PROVIDERS,
  provide(AuthBackend, {useClass: WebWorkerFirebaseAuth})
];

export const WORKER_RENDER_FIREBASE_PROVIDERS: any[] = [
  COMMON_PROVIDERS,
  provide(FirebaseSdkAuthBackend, {
    useFactory: (ref: Firebase) => new FirebaseSdkAuthBackend(ref, true),
    deps: [FirebaseRef]
  }),
  MessageBasedFirebaseAuth
];

export const defaultFirebase = (url: string): Provider => {
  return provide(FirebaseUrl, {
    useValue: url
  });
};

export {FirebaseListObservable} from './utils/firebase_list_observable';
export {FirebaseObjectObservable} from './utils/firebase_object_observable';
export {
  FirebaseAuth,
  firebaseAuthConfig
} from './providers/auth';
export {
  FirebaseAuthState,
  AuthMethods,
  AuthProviders,
} from './providers/auth_backend';
export {FirebaseUrl, FirebaseRef, FirebaseAuthConfig} from './tokens';
export {MessageBasedFirebaseAuth} from './providers/web_workers/ui/auth';

// Helps Angular-CLI automatically add providers
export default {
  providers: FIREBASE_PROVIDERS
}

