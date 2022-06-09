import { AppCheck as FirebaseAppCheck } from 'firebase/app-check';
import { ɵgetAllInstancesOf } from '@angular/fire';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

export const APP_CHECK_PROVIDER_NAME = 'app-check';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface AppCheck extends FirebaseAppCheck {}

export class AppCheck {
  constructor(appCheck: FirebaseAppCheck) {
    return appCheck;
  }
}

// tslint:disable-next-line:no-empty-interface
export interface AppCheckInstances extends Array<FirebaseAppCheck> {}

export class AppCheckInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebaseAppCheck>(APP_CHECK_PROVIDER_NAME);
  }
}

export const appCheckInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseAppCheck>(APP_CHECK_PROVIDER_NAME))),
  distinct(),
);
