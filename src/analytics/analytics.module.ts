import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { Analytics as FirebaseAnalytics, initializeAnalytics } from 'firebase/analytics';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance, ɵAngularFireSchedulers } from '@angular/fire';
import { Analytics, ANALYTICS_PROVIDER_NAME, AnalyticsInstances } from './analytics';
import { getApp } from 'firebase/app';
import { FirebaseApps } from '@angular/fire/app';

export const PROVIDED_ANALYTICS_INSTANCES = new InjectionToken<Analytics[]>('angularfire2.analytics-instances');

export function defaultAnalyticsInstanceFactory(_: Analytics[]) {
  const defaultAnalytics = ɵgetDefaultInstanceOf<FirebaseAnalytics>(ANALYTICS_PROVIDER_NAME) || initializeAnalytics(getApp());
  return new Analytics(defaultAnalytics);
}

export function analyticsInstanceFactory(fn: () => FirebaseAnalytics) {
  return (zone: NgZone) => {
    const analytics = ɵmemoizeInstance<FirebaseAnalytics>(fn, zone);
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
    NgZone,
    [new Optional(), PROVIDED_ANALYTICS_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_ANALYTICS_INSTANCE_PROVIDER,
    ANALYTICS_INSTANCES_PROVIDER,
  ]
})
export class AnalyticsModule {
}

export function provideAnalytics(fn: () => FirebaseAnalytics): ModuleWithProviders<AnalyticsModule> {
  return {
    ngModule: AnalyticsModule,
    providers: [{
      provide: PROVIDED_ANALYTICS_INSTANCES,
      useFactory: analyticsInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        FirebaseApps,
      ]
    }]
  };
}
