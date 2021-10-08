import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, APP_INITIALIZER, Injector } from '@angular/core';
import { Analytics as FirebaseAnalytics } from 'firebase/analytics';
import { ɵgetDefaultInstanceOf, ɵAngularFireSchedulers, VERSION, ɵisAnalyticsSupportedFactory } from '@angular/fire';
import { Analytics, ANALYTICS_PROVIDER_NAME, AnalyticsInstances } from './analytics';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';
import { ScreenTrackingService } from './screen-tracking.service';
import { UserTrackingService } from './user-tracking.service';

export const PROVIDED_ANALYTICS_INSTANCES = new InjectionToken<Analytics[]>('angularfire2.analytics-instances');

export function defaultAnalyticsInstanceFactory(provided: FirebaseAnalytics[]|undefined, defaultApp: FirebaseApp) {
  if (!ɵisAnalyticsSupportedFactory.sync()) { return null; }
  const defaultAnalytics = ɵgetDefaultInstanceOf<FirebaseAnalytics>(ANALYTICS_PROVIDER_NAME, provided, defaultApp);
  return defaultAnalytics && new Analytics(defaultAnalytics);
}

export function analyticsInstanceFactory(fn: (injector: Injector) => FirebaseAnalytics) {
  return (zone: NgZone, injector: Injector) => {
    if (!ɵisAnalyticsSupportedFactory.sync()) { return null; }
    const analytics = zone.runOutsideAngular(() => fn(injector));
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
    [new Optional(), PROVIDED_ANALYTICS_INSTANCES ],
    FirebaseApp,
  ]
};

@NgModule({
  providers: [
    DEFAULT_ANALYTICS_INSTANCE_PROVIDER,
    ANALYTICS_INSTANCES_PROVIDER,
    {
      provide: APP_INITIALIZER,
      useValue: ɵisAnalyticsSupportedFactory.async,
      multi: true,
    }
  ]
})
export class AnalyticsModule {
  constructor(
    @Optional() _screenTrackingService: ScreenTrackingService,
    @Optional() _userTrackingService: UserTrackingService,
  ) {
    registerVersion('angularfire', VERSION.full, 'analytics');
  }
}

export function provideAnalytics(fn: (injector: Injector) => FirebaseAnalytics, ...deps: any[]): ModuleWithProviders<AnalyticsModule> {
  return {
    ngModule: AnalyticsModule,
    providers: [{
      provide: PROVIDED_ANALYTICS_INSTANCES,
      useFactory: analyticsInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        ɵAngularFireSchedulers,
        FirebaseApps,
        ...deps,
      ]
    }]
  };
}
