import { ɵgetAllInstancesOf } from '@angular/fire';
import { Auth as FirebaseAuth } from 'firebase/auth';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

export const AUTH_PROVIDER_NAME = 'auth';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Auth extends FirebaseAuth {}

export class Auth {
  constructor(auth: FirebaseAuth) {
    return auth;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AuthInstances extends Array<FirebaseAuth> {}

export class AuthInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebaseAuth>(AUTH_PROVIDER_NAME);
  }
}

export const authInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseAuth>(AUTH_PROVIDER_NAME))),
  distinct(),
);
