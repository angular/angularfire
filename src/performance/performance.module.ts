import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { FirebasePerformance } from 'firebase/performance';

import { ɵgetDefaultInstanceOf, ɵmemoizeInstance } from '../core';
import { Performance, PerformanceInstances, PERFORMANCE_PROVIDER_NAME } from './performance';
import { PROVIDED_FIREBASE_APPS } from '../app/app.module';
import { ɵAngularFireSchedulers } from '../zones';

export const PROVIDED_PERFORMANCE_INSTANCES = new InjectionToken<Performance[]>('angularfire2.performance-instances');

export function ɵdefaultPerformanceInstanceFactory(_: Performance[]) {
  const defaultPerformance = ɵgetDefaultInstanceOf<FirebasePerformance>(PERFORMANCE_PROVIDER_NAME);
  return new Performance(defaultPerformance);
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundPerformanceInstanceFactory(zone: NgZone) {
  const performance = ɵmemoizeInstance<FirebasePerformance>(this, zone);
  return new Performance(performance);
}


const PERFORMANCE_INSTANCES_PROVIDER = {
  provide: PerformanceInstances,
  deps: [
    [new Optional(), PROVIDED_PERFORMANCE_INSTANCES ],
  ]
};

const DEFAULT_PERFORMANCE_INSTANCE_PROVIDER = {
  provide: Performance,
  useFactory: ɵdefaultPerformanceInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), PROVIDED_PERFORMANCE_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_PERFORMANCE_INSTANCE_PROVIDER,
    PERFORMANCE_INSTANCES_PROVIDER,
  ]
})
export class AngularFirePerformanceModule {
}

export function providePerformance(fn: () => FirebasePerformance): ModuleWithProviders<AngularFirePerformanceModule> {
  return {
    ngModule: AngularFirePerformanceModule,
    providers: [{
      provide: PROVIDED_PERFORMANCE_INSTANCES,
      useFactory: ɵboundPerformanceInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), PROVIDED_FIREBASE_APPS ]
      ]
    }]
  };
}
