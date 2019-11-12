import { Injectable, Inject, Optional, NgZone, InjectionToken } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, tap, filter, withLatestFrom } from 'rxjs/operators';
import { FirebaseAppConfig, FirebaseOptions, runOutsideAngular } from '@angular/fire';
import { Router, NavigationEnd, ActivationEnd } from '@angular/router';
import { FirebaseAnalytics, FIREBASE_OPTIONS, FIREBASE_APP_NAME, _firebaseAppFactory } from '@angular/fire';

export const AUTOMATICALLY_SET_CURRENT_SCREEN = new InjectionToken<boolean>('angularfire2.analytics.setCurrentScreen');
export const AUTOMATICALLY_LOG_SCREEN_VIEWS = new InjectionToken<boolean>('angularfire2.analytics.logScreenViews');
export const ANALYTICS_COLLECTION_ENABLED = new InjectionToken<boolean>('angularfire2.analytics.analyticsCollectionEnabled');
export const AUTOMATICALLY_TRACK_USER_IDENTIFIER = new InjectionToken<boolean>('angularfire2.analytics.trackUserIdentifier');
export const APP_VERSION = new InjectionToken<string>('angularfire2.analytics.appVersion');
export const APP_NAME = new InjectionToken<string>('angularfire2.analytics.appName');

export const DEFAULT_APP_VERSION = '?';
export const DEFAULT_APP_NAME = 'Angular App';

@Injectable()
export class AngularFireAnalytics {

  /**
   * Firebase Analytics instance
   */
  public readonly analytics: Observable<FirebaseAnalytics>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() router:Router,
    @Optional() @Inject(AUTOMATICALLY_SET_CURRENT_SCREEN) automaticallySetCurrentScreen:boolean|null,
    @Optional() @Inject(AUTOMATICALLY_LOG_SCREEN_VIEWS) automaticallyLogScreenViews:boolean|null,
    @Optional() @Inject(ANALYTICS_COLLECTION_ENABLED) analyticsCollectionEnabled:boolean|null,
    @Optional() @Inject(AUTOMATICALLY_TRACK_USER_IDENTIFIER) automaticallyTrackUserIdentifier:boolean|null,
    @Optional() @Inject(APP_VERSION) providedAppVersion:string|null,
    @Optional() @Inject(APP_NAME) providedAppName:string|null,
    zone: NgZone
  ) {
    // @ts-ignore zapping in the UMD in the build script
    const requireAnalytics = from(import('firebase/analytics'));
    const app = _firebaseAppFactory(options, zone, nameOrConfig);

    this.analytics = requireAnalytics.pipe(
      map(() => app.analytics()),
      tap(analytics => {
        if (analyticsCollectionEnabled === false) { analytics.setAnalyticsCollectionEnabled(false) }
      }),
      runOutsideAngular(zone)
    );

    if (router && (automaticallySetCurrentScreen !== false || automaticallyLogScreenViews !== false)) {
      const app_name = providedAppName || DEFAULT_APP_NAME;
      const app_version = providedAppVersion || DEFAULT_APP_VERSION;
      const activationEndEvents = router.events.pipe(filter<ActivationEnd>(e => e instanceof ActivationEnd));
      const navigationEndEvents = router.events.pipe(filter<NavigationEnd>(e => e instanceof NavigationEnd));
      navigationEndEvents.pipe(
        withLatestFrom(activationEndEvents, this.analytics),
        tap(([navigationEnd, activationEnd, analytics]) => {
          const url = navigationEnd.url;
          const screen_name = activationEnd.snapshot.routeConfig && activationEnd.snapshot.routeConfig.path || undefined;
          const outlet = activationEnd.snapshot.outlet;
          if (automaticallyLogScreenViews !== false) {
            analytics.logEvent("screen_view", { app_name, app_version, screen_name, outlet, url });
          }
          if (automaticallySetCurrentScreen !== false) {
            // TODO when is screen_name undefined?
            analytics.setCurrentScreen(screen_name || url, { global: outlet == "primary" });
          }
        }),
        runOutsideAngular(zone)
      ).subscribe();
    }

    // TODO do something other than just check auth presence, what if it's lazy loaded?
    if (app.auth && automaticallyTrackUserIdentifier !== false) {
      new Observable<firebase.User|null>(app.auth().onAuthStateChanged.bind(app.auth())).pipe(
        withLatestFrom(this.analytics),
        tap(([user, analytics]) => analytics.setUserId(user ? user.uid : null!, { global: true })),
        runOutsideAngular(zone)
      ).subscribe()
    }

  }

}
