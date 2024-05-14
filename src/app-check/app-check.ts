import { ɵAPP_CHECK_PROVIDER_NAME, ɵgetAllInstancesOf } from '@angular/fire';
import { AppCheck as FirebaseAppCheck } from 'firebase/app-check';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppCheck extends FirebaseAppCheck {}

export class AppCheck {
  constructor(appCheck: FirebaseAppCheck) {
    return appCheck;
  }
}

export const appCheckInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseAppCheck>(ɵAPP_CHECK_PROVIDER_NAME))),
  distinct(),
);
