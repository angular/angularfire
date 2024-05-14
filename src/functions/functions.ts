import { ɵgetAllInstancesOf } from '@angular/fire';
import { Functions as FirebaseFunctions } from 'firebase/functions';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Functions extends FirebaseFunctions {}

export class Functions {
  constructor(functions: FirebaseFunctions) {
    return functions;
  }
}

export const FUNCTIONS_PROVIDER_NAME = 'functions';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FunctionsInstances extends Array<FirebaseFunctions> {}

export class FunctionsInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebaseFunctions>(FUNCTIONS_PROVIDER_NAME);
  }
}

export const functionInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseFunctions>(FUNCTIONS_PROVIDER_NAME))),
  distinct(),
);
