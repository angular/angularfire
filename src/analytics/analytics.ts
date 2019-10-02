import { Injectable, Inject, Optional, NgZone, InjectionToken } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, tap, filter } from 'rxjs/operators';
import { FirebaseAppConfig, FirebaseOptions, runOutsideAngular } from '@angular/fire';
import { Router, NavigationEnd } from '@angular/router';
import { FirebaseAnalytics, FirebaseOptionsToken, FirebaseNameOrConfigToken, _firebaseAppFactory } from '@angular/fire';

export const AUTOMATICALLY_SET_CURRENT_SCREEN = new InjectionToken<boolean>('angularfire2.analytics.setCurrentScreen');
export const ANALYTICS_COLLECTION_ENABLED = new InjectionToken<boolean>('angularfire2.analytics.analyticsCollectionEnabled');
export const AUTOMATICALLY_TRACK_USER_IDENTIFIER = new InjectionToken<boolean>('angularfire2.analytics.trackUserIdentifier');

@Injectable()
export class AngularFireAnalytics {

  /**
   * Firebase Analytics instance
   */
  public readonly analytics: Observable<FirebaseAnalytics>;

  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseNameOrConfigToken) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() router:Router,
    @Optional() @Inject(AUTOMATICALLY_SET_CURRENT_SCREEN) automaticallySetCurrentScreen:boolean|null,
    @Optional() @Inject(ANALYTICS_COLLECTION_ENABLED) analyticsCollectionEnabled:boolean|null,
    @Optional() @Inject(AUTOMATICALLY_TRACK_USER_IDENTIFIER) automaticallyTrackUserIdentifier:boolean|null,
    private zone: NgZone
  ) {
    // @ts-ignore zapping in the UMD in the build script
    const requireAnalytics = from(import('firebase/analytics'));

    this.analytics = requireAnalytics.pipe(
      map(() => _firebaseAppFactory(options, nameOrConfig)),
      map(app => app.analytics()),
      tap(analytics => {
        if (analyticsCollectionEnabled == false) { analytics.setAnalyticsCollectionEnabled(false) }
      }),
      runOutsideAngular(zone)
    );

    if (router && automaticallySetCurrentScreen !== false) {
      this.analytics.pipe(
        switchMap(analytics =>
          router.events.pipe(
            filter<NavigationEnd>(e => e instanceof NavigationEnd),
            tap(e => console.log(e)),
            tap(e => analytics.setCurrentScreen(e.url))
          )
        )
      ).subscribe();
    }

    if (automaticallyTrackUserIdentifier !== false) {
      this.analytics.pipe(
        switchMap(analytics => {
          if (analytics.app.auth) {
            const auth = analytics.app.auth();
            return new Observable<firebase.User|null>(auth.onAuthStateChanged.bind(auth)).pipe(
              tap(user => console.log("uid", user && user.uid)),
              tap(user => user ? analytics.setUserId(user.uid) : analytics.setUserId(null!))
            )
          } else {
            return of()
          }
        }),
        runOutsideAngular(zone)
      ).subscribe()
    }

  }

}
