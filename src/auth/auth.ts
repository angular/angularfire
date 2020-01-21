import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FIREBASE_OPTIONS, FIREBASE_APP_NAME, FirebaseOptions, FirebaseAppConfig, FirebaseAuth, _firebaseAppFactory, AngularFireSchedulers, keepUnstableUntilFirstFactory } from '@angular/fire';
import { User, auth } from 'firebase/app';

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
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    const keepUnstableUntilFirst = keepUnstableUntilFirstFactory(new AngularFireSchedulers(zone), platformId);

    this.auth = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, zone, nameOrConfig);
      return app.auth();
    });

    this.authState = new Observable<User | null>(subscriber => {
      return zone.runOutsideAngular(() => this.auth.onIdTokenChanged(subscriber));
    }).pipe(keepUnstableUntilFirst);;

    this.user = new Observable<User | null>(subscriber => {
      return zone.runOutsideAngular(() => this.auth.onIdTokenChanged(subscriber));
    }).pipe(keepUnstableUntilFirst);

    this.idToken = this.user.pipe(switchMap(user => {
      return user ? from(user.getIdToken()) : of(null)
    }));

    this.idTokenResult = this.user.pipe(switchMap(user => {
      return user ? from(user.getIdTokenResult()) : of(null)
    }));
  }

}
