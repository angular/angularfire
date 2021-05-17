import { NgModule, Optional, NgZone, InjectionToken } from '@angular/core';
import { FirebasePerformance } from 'firebase/performance';

import { ɵsmartCacheInstance, ɵfetchCachedInstance } from '../core';
import { Performance } from './performance';
import { DEFAULT_APP_NAME, FIREBASE_APPS } from '../app/app.module';
import { ɵAngularFireSchedulers } from '../zones';

export const PERFORMANCE_INSTANCES = new InjectionToken<Performance[]>('angularfire2.performance-instances');

const CACHE_PREFIX = 'Performance';

export function ɵdefaultPerformanceInstanceFactory(_: Performance[]) {
  const performance = ɵfetchCachedInstance([CACHE_PREFIX, DEFAULT_APP_NAME].join('.'));
  if (performance) {
    return new Performance(performance);
  }
  throw new Error(`No Performance Instance provided for the '${DEFAULT_APP_NAME}' Firebase App - call providePerformance(...) in your providers list.`);
}

export function ɵwrapPerformanceInstanceInInjectable(performance: FirebasePerformance) {
  return new Performance(performance);
}

export function ɵperformanceInstancesFactory(instances: Performance[]) {
  return instances;
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundPerformanceInstanceFactory(zone: NgZone) {
  const performance = ɵsmartCacheInstance<FirebasePerformance>(CACHE_PREFIX, this, zone);
  return new Performance(performance);
}

const DEFAULT_PERFORMANCE_INSTANCE_PROVIDER = {
  provide: Performance,
  useFactory: ɵdefaultPerformanceInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), PERFORMANCE_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_PERFORMANCE_INSTANCE_PROVIDER,
  ]
})
export class AngularFirePerformanceModule {
}

export function providePerformance(fn: () => FirebasePerformance) {
  return {
    ngModule: AngularFirePerformanceModule,
    providers: [{
      provide: PERFORMANCE_INSTANCES,
      useFactory: ɵboundPerformanceInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), FIREBASE_APPS ]
      ]
    }]
  };
}
