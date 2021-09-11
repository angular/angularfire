import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { FirebasePerformance } from 'firebase/performance';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { Performance, PerformanceInstances, PERFORMANCE_PROVIDER_NAME } from './performance';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';

export const PROVIDED_PERFORMANCE_INSTANCES = new InjectionToken<Performance[]>('angularfire2.performance-instances');

export function defaultPerformanceInstanceFactory(provided: FirebasePerformance[]|undefined, defaultApp: FirebaseApp) {
  const defaultPerformance = ɵgetDefaultInstanceOf<FirebasePerformance>(PERFORMANCE_PROVIDER_NAME, provided, defaultApp);
  return new Performance(defaultPerformance);
}

export function performanceInstanceFactory(fn: () => FirebasePerformance) {
  return (zone: NgZone) => {
    const performance = ɵmemoizeInstance<FirebasePerformance>(fn, zone);
    return new Performance(performance);
  };
}

const PERFORMANCE_INSTANCES_PROVIDER = {
  provide: PerformanceInstances,
  deps: [
    [new Optional(), PROVIDED_PERFORMANCE_INSTANCES ],
  ]
};

const DEFAULT_PERFORMANCE_INSTANCE_PROVIDER = {
  provide: Performance,
  useFactory: defaultPerformanceInstanceFactory,
  deps: [
    [new Optional(), PROVIDED_PERFORMANCE_INSTANCES ],
    FirebaseApp,
  ]
};

@NgModule({
  providers: [
    DEFAULT_PERFORMANCE_INSTANCE_PROVIDER,
    PERFORMANCE_INSTANCES_PROVIDER,
  ]
})
export class PerformanceModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'perf');
  }
}

export function providePerformance(fn: () => FirebasePerformance): ModuleWithProviders<PerformanceModule> {
  return {
    ngModule: PerformanceModule,
    providers: [{
      provide: PROVIDED_PERFORMANCE_INSTANCES,
      useFactory: performanceInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        FirebaseApps,
      ]
    }]
  };
}
