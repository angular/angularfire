import {provide} from 'angular2/core';
import {COMMON_PROVIDERS} from './angularfire2';
import {AuthBackend} from './auth/auth_backend';
import {WebWorkerFirebaseAuth} from './auth/web_workers/worker/auth';

export const WORKER_APP_FIREBASE_PROVIDERS: any[] = [
  COMMON_PROVIDERS,
  provide(AuthBackend, {useClass: WebWorkerFirebaseAuth})
];
