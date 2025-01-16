import { ɵgetAllInstancesOf } from '@angular/fire';
import { AppCheck as FirebaseAppCheck } from 'firebase/app-check';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

export const APP_CHECK_PROVIDER_NAME = 'app-check';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppCheck extends FirebaseAppCheck {}

export class AppCheck {
  constructor(appCheck: FirebaseAppCheck) {
    return appCheck;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppCheckInstances extends Array<AppCheck> {}

export class AppCheckInstances {
  constructor() {
    return ɵgetAllInstancesOf<AppCheck>(APP_CHECK_PROVIDER_NAME);
  }
}

export const appCheckInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseAppCheck>(APP_CHECK_PROVIDER_NAME))),
  distinct(),
);
