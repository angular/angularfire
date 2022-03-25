import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, PLATFORM_ID, Injector } from '@angular/core';
import { FirebasePerformance } from 'firebase/performance';
import { ɵgetDefaultInstanceOf, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { Performance, PerformanceInstances, PERFORMANCE_PROVIDER_NAME } from './performance';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';
import { isPlatformBrowser } from '@angular/common';

export const PROVIDED_PERFORMANCE_INSTANCES = new InjectionToken<Performance[]>('angularfire2.performance-instances');

export function defaultPerformanceInstanceFactory(
  provided: FirebasePerformance[]|undefined,
  defaultApp: FirebaseApp,
  // tslint:disable-next-line:ban-types
  platform: Object
) {
  if (!isPlatformBrowser(platform)) { return null; }
  const defaultPerformance = ɵgetDefaultInstanceOf<FirebasePerformance>(PERFORMANCE_PROVIDER_NAME, provided, defaultApp);
  return defaultPerformance && new Performance(defaultPerformance);
}

export function performanceInstanceFactory(fn: (injector: Injector) => FirebasePerformance) {
  // tslint:disable-next-line:ban-types
  return (zone: NgZone, platform: Object, injector: Injector) => {
    if (!isPlatformBrowser(platform)) { return null; }
    const performance = zone.runOutsideAngular(() => fn(injector));
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
    PLATFORM_ID,
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

export function providePerformance(fn: (injector: Injector) => FirebasePerformance, ...deps: any[]): ModuleWithProviders<PerformanceModule> {
  return {
    ngModule: PerformanceModule,
    providers: [{
      provide: PROVIDED_PERFORMANCE_INSTANCES,
      useFactory: performanceInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        PLATFORM_ID,
        Injector,
        ɵAngularFireSchedulers,
        FirebaseApps,
        ...deps,
      ]
    }]
  };
}
