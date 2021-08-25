import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, APP_INITIALIZER } from '@angular/core';
import { Analytics as FirebaseAnalytics, isSupported } from 'firebase/analytics';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance, ɵAngularFireSchedulers } from '@angular/fire';
import { Analytics, ANALYTICS_PROVIDER_NAME, AnalyticsInstances } from './analytics';
import { FirebaseApps } from '@angular/fire/app';

const PROVIDED_ANALYTICS_INSTANCES = new InjectionToken<Analytics[]>('angularfire2.analytics-instances');
const IS_SUPPORTED = new InjectionToken<boolean>('angularfire2.analytics.isSupported');

const isSupportedSymbol = Symbol('angularfire2.analytics.isSupported');

export function defaultAnalyticsInstanceFactory(isSupported: boolean) {
  const defaultAnalytics = isSupported ? ɵgetDefaultInstanceOf<FirebaseAnalytics>(ANALYTICS_PROVIDER_NAME) : undefined;
  return new Analytics(defaultAnalytics);
}

export function analyticsInstanceFactory(fn: () => FirebaseAnalytics) {
  return (zone: NgZone, isSupported: boolean) => {
    const analytics = isSupported ? ɵmemoizeInstance<FirebaseAnalytics>(fn, zone) : undefined;
    return new Analytics(analytics);
  };
}

const ANALYTICS_INSTANCES_PROVIDER = {
  provide: AnalyticsInstances,
  deps: [
    [new Optional(), PROVIDED_ANALYTICS_INSTANCES ],
  ]
};

const DEFAULT_ANALYTICS_INSTANCE_PROVIDER = {
  provide: Analytics,
  useFactory: defaultAnalyticsInstanceFactory,
  deps: [
    IS_SUPPORTED,
    NgZone,
    [new Optional(), PROVIDED_ANALYTICS_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_ANALYTICS_INSTANCE_PROVIDER,
    ANALYTICS_INSTANCES_PROVIDER,
    {
      provide: APP_INITIALIZER,
      useValue: () => isSupported().then(it => globalThis[isSupportedSymbol] = it),
      multi: true,
    },
  ]
})
export class AnalyticsModule {
}

export function provideAnalytics(fn: () => FirebaseAnalytics): ModuleWithProviders<AnalyticsModule> {
  return {
    ngModule: AnalyticsModule,
    providers: [{
      provide: IS_SUPPORTED,
      useFactory: () => globalThis[isSupportedSymbol],
    }, {
      provide: PROVIDED_ANALYTICS_INSTANCES,
      useFactory: analyticsInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        IS_SUPPORTED,
        ɵAngularFireSchedulers,
        FirebaseApps,
      ]
    }]
  };
}
