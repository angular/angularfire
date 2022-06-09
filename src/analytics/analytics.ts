import { Analytics as FirebaseAnalytics } from 'firebase/analytics';
import { ɵgetAllInstancesOf } from '@angular/fire';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Analytics extends FirebaseAnalytics {}

export class Analytics {
  constructor(analytics: FirebaseAnalytics) {
    return analytics;
  }
}

export const ANALYTICS_PROVIDER_NAME = 'analytics';

// tslint:disable-next-line:no-empty-interface
export interface AnalyticsInstances extends Array<FirebaseAnalytics> {}

export class AnalyticsInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebaseAnalytics>(ANALYTICS_PROVIDER_NAME);
  }
}

export const analyticInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseAnalytics>(ANALYTICS_PROVIDER_NAME))),
  distinct(),
);
