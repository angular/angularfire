import { APP_INITIALIZER, InjectionToken, Injector, ModuleWithProviders, NgModule, NgZone, Optional } from '@angular/core';
import { VERSION, ɵAngularFireSchedulers, ɵgetDefaultInstanceOf } from '@angular/fire';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { Analytics as FirebaseAnalytics } from 'firebase/analytics';
import { registerVersion } from 'firebase/app';
import { ANALYTICS_PROVIDER_NAME, Analytics, AnalyticsInstances } from './analytics';
import { isAnalyticsSupportedFactory } from './is-analytics-supported-factory';
import { ScreenTrackingService } from './screen-tracking.service';
import { UserTrackingService } from './user-tracking.service';

export const PROVIDED_ANALYTICS_INSTANCES = new InjectionToken<Analytics[]>('angularfire2.analytics-instances');

export function defaultAnalyticsInstanceFactory(provided: FirebaseAnalytics[]|undefined, defaultApp: FirebaseApp) {
  if (!isAnalyticsSupportedFactory.sync()) { return null; }
  const defaultAnalytics = ɵgetDefaultInstanceOf<FirebaseAnalytics>(ANALYTICS_PROVIDER_NAME, provided, defaultApp);
  return defaultAnalytics && new Analytics(defaultAnalytics);
}

export function analyticsInstanceFactory(fn: (injector: Injector) => FirebaseAnalytics) {
  return (zone: NgZone, injector: Injector) => {
    if (!isAnalyticsSupportedFactory.sync()) { return null; }
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
      useValue: isAnalyticsSupportedFactory.async,
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
