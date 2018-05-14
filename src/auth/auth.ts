import { FirebaseAuth, User, IdTokenResult } from '@firebase/auth-types';
import { FirebaseOptions, FirebaseAppConfig } from '@firebase/app-types';
import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';
import { from } from 'rxjs/observable/from';

import { FirebaseOptionsToken, FirebaseAppConfigToken, FirebaseAppNameToken, _firebaseAppFactory, FirebaseZoneScheduler } from 'angularfire2';


@Injectable()
export class AngularFireAuth {

  /**
   * Firebase Auth instance
   */
  public readonly auth: FirebaseAuth;

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
  public readonly idTokenResult: Observable<IdTokenResult|null>;

  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseAppConfigToken) config:FirebaseAppConfig,
    @Optional() @Inject(FirebaseAppNameToken) name:string,
    @Inject(PLATFORM_ID) platformId: Object,
    private zone: NgZone
  ) {
    const scheduler = new FirebaseZoneScheduler(zone, platformId);
    this.auth = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, name, config);
      return app.auth();
    });

    this.authState = scheduler.keepUnstableUntilFirst(
      scheduler.runOutsideAngular(
        new Observable(subscriber => {
          const unsubscribe = this.auth.onAuthStateChanged(subscriber);
          return { unsubscribe };
        })
      )
    );

    this.user = scheduler.keepUnstableUntilFirst(
      scheduler.runOutsideAngular(
        new Observable(subscriber => {
          const unsubscribe = this.auth.onIdTokenChanged(subscriber);
          return { unsubscribe };
        })
      )
    );

    this.idToken = this.user.pipe(switchMap(user => {
      return user ? from(user.getIdToken()) : of(null)
    }));

    this.idTokenResult = this.user.pipe(switchMap(user => {
      return user ? from(user.getIdTokenResult()) : of(null)
    }));
  }

}
