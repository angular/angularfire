import { FirebaseAuth, User } from '@firebase/auth-types';
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
   * Observable of authentication state; as of 4.0 this is only triggered via sign-in/out
   */
  public readonly authState: Observable<User|null>;

  /**
   * Observable of the signed-in user's ID token; which includes sign-in, sign-out, and token refresh events
   */
  public readonly idToken: Observable<string|null>;

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

    this.idToken = scheduler.keepUnstableUntilFirst(
      scheduler.runOutsideAngular(
        new Observable(subscriber => {
          const unsubscribe = this.auth.onIdTokenChanged(subscriber);
          return { unsubscribe };
        })
      )
    ).pipe(switchMap((user:User) => {
      return user ? from(user.getIdToken()) : of(null)
    }));    
  }

}
