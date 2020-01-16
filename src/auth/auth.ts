import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { switchMap, shareReplay, map } from 'rxjs/operators';
import { FIREBASE_OPTIONS, FIREBASE_APP_NAME, FirebaseOptions, FirebaseAppConfig, ɵfirebaseAppFactory, ɵFirebaseZoneScheduler, ɵrunOutsideAngular, ɵPromiseProxy, ɵlazySDKProxy } from '@angular/fire';
import { User, auth } from 'firebase/app';

export interface AngularFireAuth extends ɵPromiseProxy<auth.Auth> {};

@Injectable({
  providedIn: 'root'
})
export class AngularFireAuth {

  /**
   * Observable of authentication state; as of Firebase 4.0 this is only triggered via sign-in/out
   */
  public readonly authState: Observable<User|null>;

  /**
   * Observable of the currently signed-in user's JWT token used to identify the user to a Firebase service (or null).
   */
  public readonly idToken: Observable<string|null>;

  /**
   * Observable of the currently signed-in user (or null).
   */
  public readonly user: Observable<User|null>;

  /**
   * Observable of the currently signed-in user's IdTokenResult object which contains the ID token JWT string and other
   * helper properties for getting different data associated with the token as well as all the decoded payload claims
   * (or null).
   */
  public readonly idTokenResult: Observable<auth.IdTokenResult|null>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    private zone: NgZone
  ) {
    const scheduler = new ɵFirebaseZoneScheduler(zone, platformId);

    const auth = of(undefined).pipe(
      switchMap(() => zone.runOutsideAngular(() => import('firebase/auth'))),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => app.auth()),
      ɵrunOutsideAngular(zone),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.authState = auth.pipe(
      switchMap(auth => from(auth.onAuthStateChanged)),
      ɵrunOutsideAngular(zone),
      scheduler.keepUnstableUntilFirst.bind(scheduler),
    );

    this.user = auth.pipe(
      switchMap(auth => from(auth.onIdTokenChanged)),
      ɵrunOutsideAngular(zone),
      scheduler.keepUnstableUntilFirst.bind(scheduler),
    );

    this.idToken = this.user.pipe(
      switchMap(user => user ? from(user.getIdToken()) : of(null))
    );

    this.idTokenResult = this.user.pipe(
      switchMap(user => user ? from(user.getIdTokenResult()) : of(null))
    );

    return ɵlazySDKProxy(this, auth, zone);

  }

}
