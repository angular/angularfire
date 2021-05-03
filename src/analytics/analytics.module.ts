import { NgModule, Optional, NgZone, InjectionToken } from '@angular/core';
import { Analytics as FirebaseAnalytics } from 'firebase/analytics';

import { ɵsmartCacheInstance, ɵfetchCachedInstance } from '../core';
import { Analytics } from './analytics';
import { DEFAULT_APP_NAME, FIREBASE_APPS } from '../app/app.module';

export const ANALYTICS_INSTANCES = new InjectionToken<Analytics[]>('angularfire2.analytics-instances');

const CACHE_PREFIX = 'Analytics';

export function ɵdefaultAnalyticsInstanceFactory(_: Analytics[]) {
  const analytics = ɵfetchCachedInstance([CACHE_PREFIX, DEFAULT_APP_NAME].join('.'));
  if (analytics) {
    return new Analytics(analytics);
  }
  throw new Error(`No Analytics Instance provided for the '${DEFAULT_APP_NAME}' Firebase App - call provideAnalytics(...) in your providers list.`);
}

export function ɵwrapAnalyticsInstanceInInjectable(analytics: FirebaseAnalytics) {
  return new Analytics(analytics);
}

export function ɵanalyticsInstancesFactory(instances: Analytics[]) {
  return instances;
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundAnalyticsInstanceFactory(zone: NgZone) {
  const analytics = ɵsmartCacheInstance<FirebaseAnalytics>(CACHE_PREFIX, this);
  return new Analytics(analytics);
}

const DEFAULT_ANALYTICS_INSTANCE_PROVIDER = {
  provide: Analytics,
  useFactory: ɵdefaultAnalyticsInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), ANALYTICS_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_ANALYTICS_INSTANCE_PROVIDER,
  ]
})
export class AngularFireAnalyticsModule {
}

export function provideAnalytics(fn: () => FirebaseAnalytics) {
  return {
    ngModule: AngularFireAnalyticsModule,
    providers: [{
      provide: ANALYTICS_INSTANCES,
      useFactory: ɵboundAnalyticsInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        [new Optional(), FIREBASE_APPS ]
      ]
    }]
  };
}
