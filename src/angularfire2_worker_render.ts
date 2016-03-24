import {provide} from 'angular2/core';
import {COMMON_PROVIDERS} from './angularfire2';
import {FirebaseSdkAuthBackend} from './auth/firebase_sdk_auth_backend';
import {WebWorkerFirebaseAuth} from './auth/web_workers/worker/auth';
import {FirebaseRef} from './tokens';
import {MessageBasedFirebaseAuth} from './auth/web_workers/ui/auth';

export const WORKER_RENDER_FIREBASE_PROVIDERS: any[] = [
  COMMON_PROVIDERS,
  provide(FirebaseSdkAuthBackend, {
    useFactory: (ref: Firebase) => new FirebaseSdkAuthBackend(ref, true),
    deps: [FirebaseRef]
  }),
  MessageBasedFirebaseAuth
];