import { Auth as FirebaseAuth } from 'firebase/auth';
import { ɵgetAllInstancesOf } from '@angular/fire';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';
import { Inject, PLATFORM_ID } from '@angular/core';

export const AUTH_PROVIDER_NAME = 'auth';

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
  // tslint:disable-next-line:ban-types
  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    const instances = ɵgetAllInstancesOf<FirebaseAuth>(AUTH_PROVIDER_NAME);
    instances.forEach((it: any) => it._logFramework(`angularfire-${platformId}`));
    return instances;
  }
}

export const authInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseAuth>(AUTH_PROVIDER_NAME))),
  distinct(),
);
