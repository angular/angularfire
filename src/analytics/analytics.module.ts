import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { Analytics as FirebaseAnalytics } from 'firebase/analytics';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance } from '../core';
import { Analytics, ANALYTICS_PROVIDER_NAME, AnalyticsInstances } from './analytics';
import { PROVIDED_FIREBASE_APPS } from '../app/app.module';
import { ɵAngularFireSchedulers } from '../zones';

export const PROVIDED_ANALYTICS_INSTANCES = new InjectionToken<Analytics[]>('angularfire2.analytics-instances');

export function ɵdefaultAnalyticsInstanceFactory(_: Analytics[]) {
  const defaultAnalytics = ɵgetDefaultInstanceOf<FirebaseAnalytics>(ANALYTICS_PROVIDER_NAME);
  return new Analytics(defaultAnalytics);
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundAnalyticsInstanceFactory(zone: NgZone) {
  const analytics = ɵmemoizeInstance<FirebaseAnalytics>(this, zone);
  return new Analytics(analytics);
}


const ANALYTICS_INSTANCES_PROVIDER = {
  provide: AnalyticsInstances,
  deps: [
    [new Optional(), PROVIDED_ANALYTICS_INSTANCES ],
  ]
};

const DEFAULT_ANALYTICS_INSTANCE_PROVIDER = {
  provide: Analytics,
  useFactory: ɵdefaultAnalyticsInstanceFactory,
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
export class AngularFireAnalyticsModule {
}

export function provideAnalytics(fn: () => FirebaseAnalytics): ModuleWithProviders<AngularFireAnalyticsModule> {
  return {
    ngModule: AngularFireAnalyticsModule,
    providers: [{
      provide: PROVIDED_ANALYTICS_INSTANCES,
      useFactory: ɵboundAnalyticsInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), PROVIDED_FIREBASE_APPS ]
      ]
    }]
  };
}
