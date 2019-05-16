import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FirebaseAppConfig, FirebaseOptions, TypicalDependencyInjection } from '@angular/fire';
import { User, auth } from 'firebase/app';

import { FirebaseAuth, FirebaseOptionsToken, FirebaseNameOrConfigToken, _firebaseAppFactory, FirebaseZoneScheduler } from '@angular/fire';

// TODO clean up anys
export const getInstance =
  (config: TypicalDependencyInjection) =>
    new AngularFireAuth(config.options,( <any>config).appName || (<any>config).appConfig, config.platformId, config.zone);

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
  public readonly idTokenResult: Observable<auth.IdTokenResult|null>;

  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseNameOrConfigToken) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    private zone: NgZone
  ) {
    const scheduler = new FirebaseZoneScheduler(zone, platformId);
    this.auth = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, nameOrConfig);
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
