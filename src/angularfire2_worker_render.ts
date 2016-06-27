import { provide } from '@angular/core';
import { COMMON_PROVIDERS } from './angularfire2';
import { FirebaseSdkAuthBackend } from './auth/index';
import { WebWorkerFirebaseAuth } from './providers/web_workers/worker/auth';
import { FirebaseApp } from './tokens';
import { MessageBasedFirebaseAuth } from './providers/web_workers/ui/auth';

export const WORKER_RENDER_FIREBASE_PROVIDERS: any[] = [
  COMMON_PROVIDERS,
  provide(FirebaseSdkAuthBackend, {
    useFactory: (app) => new FirebaseSdkAuthBackend(app, true),
    deps: [FirebaseApp]
  }),
  MessageBasedFirebaseAuth
];

export {MessageBasedFirebaseAuth} from './providers/web_workers/ui/auth';
