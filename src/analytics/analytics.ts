import { Injectable, Inject, Optional, NgZone, InjectionToken } from '@angular/core';
import { of } from 'rxjs';
import { map, tap, shareReplay, switchMap } from 'rxjs/operators';
import { FirebaseAppConfig, FirebaseOptions, runOutsideAngular, _lazySDKProxy, FirebaseAnalytics, FIREBASE_OPTIONS, FIREBASE_APP_NAME, _firebaseAppFactory } from '@angular/fire';
import { analytics, app } from 'firebase';

export const ANALYTICS_COLLECTION_ENABLED = new InjectionToken<boolean>('angularfire2.analytics.analyticsCollectionEnabled');

// SEMVER: once we move to Typescript 3.6 use `PromiseProxy<analytics.Analytics>`
type AnalyticsProxy = {
  // TODO can we pull the richer types from the Firebase SDK .d.ts? ReturnType<T[K]> is infering
  //      I could even do this in a manual build-step
  logEvent(eventName: string, eventParams?: {[key: string]: any}, options?: analytics.AnalyticsCallOptions): Promise<void>,
  setCurrentScreen(screenName: string, options?: analytics.AnalyticsCallOptions): Promise<void>,
  setUserId(id: string, options?: analytics.AnalyticsCallOptions): Promise<void>,
  setUserProperties(properties: analytics.CustomParams, options?: analytics.AnalyticsCallOptions): Promise<void>,
  setAnalyticsCollectionEnabled(enabled: boolean): Promise<void>,
  app: Promise<app.App>
};

export interface AngularFireAnalytics extends AnalyticsProxy {};

@Injectable({
  providedIn: "root"
})
export class AngularFireAnalytics {

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(ANALYTICS_COLLECTION_ENABLED) analyticsCollectionEnabled:boolean|null,
    zone: NgZone
  ) {
    const analytics = of(undefined).pipe(
      // @ts-ignore zapping in the UMD in the build script
      switchMap(() => zone.runOutsideAngular(() => import('firebase/analytics'))),
      map(() => _firebaseAppFactory(options, zone, nameOrConfig)),
      // SEMVER no need to cast once we drop older Firebase
      map(app => <analytics.Analytics>app.analytics()),
      tap(analytics => {
        if (analyticsCollectionEnabled === false) { analytics.setAnalyticsCollectionEnabled(false) }
      }),
      runOutsideAngular(zone),
      shareReplay(1)
    );

    return _lazySDKProxy(this, analytics, zone);
  }

}