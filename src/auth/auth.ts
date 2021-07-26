import { Auth as FirebaseAuth } from 'firebase/auth';
import { ɵgetAllInstancesOf } from '../core';

export const AUTH_PROVIDER_NAME = 'auth-exp';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Auth extends FirebaseAuth {}

export class Auth {
  constructor(auth: FirebaseAuth) {
    return auth;
  }
}

// tslint:disable-next-line:no-empty-interface
export interface AuthInstances extends Array<FirebaseAuth> {}

export class AuthInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebaseAuth>(AUTH_PROVIDER_NAME);
  }
}
