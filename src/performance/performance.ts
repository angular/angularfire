import { FirebasePerformance } from 'firebase/performance';
import { ɵgetAllInstancesOf } from '@angular/fire';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Performance extends FirebasePerformance {}

export class Performance {
  constructor(performance: FirebasePerformance) {
    return performance;
  }
}

export const PERFORMANCE_PROVIDER_NAME = 'performance';

// tslint:disable-next-line:no-empty-interface
export interface PerformanceInstances extends Array<FirebasePerformance> {}

export class PerformanceInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebasePerformance>(PERFORMANCE_PROVIDER_NAME);
  }
}

export const performanceInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebasePerformance>(PERFORMANCE_PROVIDER_NAME))),
  distinct(),
);
