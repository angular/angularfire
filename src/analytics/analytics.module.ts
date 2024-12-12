import { isPlatformServer } from '@angular/common';
import {
  EnvironmentProviders,
  InjectionToken,
  Injector,
  NgModule,
  NgZone,
  Optional,
  PLATFORM_ID,
  makeEnvironmentProviders,
} from '@angular/core';
import { VERSION, ɵAngularFireSchedulers, ɵgetDefaultInstanceOf } from '@angular/fire';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { Analytics as FirebaseAnalytics } from 'firebase/analytics';
import { registerVersion } from 'firebase/app';
import { ANALYTICS_PROVIDER_NAME, Analytics, AnalyticsInstances } from './analytics';
import { ScreenTrackingService } from './screen-tracking.service';
import { UserTrackingService } from './user-tracking.service';

export const PROVIDED_ANALYTICS_INSTANCES = new InjectionToken<Analytics[]>('angularfire2.analytics-instances');

export function defaultAnalyticsInstanceFactory(provided: FirebaseAnalytics[]|undefined, defaultApp: FirebaseApp, platformId: object) {
  if (isPlatformServer(platformId)) { return null; }
  const defaultAnalytics = ɵgetDefaultInstanceOf<FirebaseAnalytics>(ANALYTICS_PROVIDER_NAME, provided, defaultApp);
  return defaultAnalytics && new Analytics(defaultAnalytics);
}

export function analyticsInstanceFactory(fn: (injector: Injector) => FirebaseAnalytics) {
  return (zone: NgZone, injector: Injector, platformId: object) => {
    if (isPlatformServer(platformId)) { return null; }
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
    PLATFORM_ID,
  ]
};

@NgModule({
  providers: [
    DEFAULT_ANALYTICS_INSTANCE_PROVIDER,
    ANALYTICS_INSTANCES_PROVIDER
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

export function provideAnalytics(fn: (injector: Injector) => FirebaseAnalytics, ...deps: any[]): EnvironmentProviders {
  registerVersion('angularfire', VERSION.full, 'analytics');

  return makeEnvironmentProviders([
    DEFAULT_ANALYTICS_INSTANCE_PROVIDER,
    ANALYTICS_INSTANCES_PROVIDER,
    {
      provide: PROVIDED_ANALYTICS_INSTANCES,
      useFactory: analyticsInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        PLATFORM_ID,
        ɵAngularFireSchedulers,
        FirebaseApps,
        ...deps,
      ],
    },
  ]);
}
