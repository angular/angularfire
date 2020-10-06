import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { switchMap, map, observeOn, shareReplay, first, tap } from 'rxjs/operators';
import {
  FIREBASE_OPTIONS,
  FIREBASE_APP_NAME,
  FirebaseOptions,
  FirebaseAppConfig,
  ɵPromiseProxy,
  ɵlazySDKProxy,
  ɵfirebaseAppFactory,
  ɵAngularFireSchedulers,
  ɵkeepUnstableUntilFirstFactory
} from '@angular/fire';
import { User, auth } from 'firebase/app';
import { isPlatformServer } from '@angular/common';

export interface AngularFireAuth extends ɵPromiseProxy<auth.Auth> {}

@Injectable({
  providedIn: 'any'
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


  public applyActionCode: (code: string) => Promise<void> = null;

  public checkActionCode: (code: string) => Promise<firebase.auth.ActionCodeInfo> = null;

  public confirmPasswordReset: (code: string, newPassword: string) => Promise<void> = null;

  public createUserWithEmailAndPassword: (
    email: string,
    password: string
  ) => Promise<firebase.auth.UserCredential> = null;

  public fetchSignInMethodsForEmail: (email: string) => Promise<Array<string>> = null;

  public isSignInWithEmailLink: (emailLink: string) => Promise<boolean> = null;

  public getRedirectResult: () => Promise<firebase.auth.UserCredential> = null;

  public onAuthStateChanged: (
    nextOrObserver:
     |firebase.Observer<any>
     |((a: firebase.User|null) => any),
    error?: (a: firebase.auth.Error) => any,
    completed?: firebase.Unsubscribe
  ) => Promise<firebase.Unsubscribe> = null;

  public onIdTokenChanged: (
    nextOrObserver:
     |firebase.Observer<any>
     |((a: firebase.User|null) => any),
    error?: (a: firebase.auth.Error) => any,
    completed?: firebase.Unsubscribe
  ) => Promise<firebase.Unsubscribe> = null;

  public sendSignInLinkToEmail: (
    email: string,
    actionCodeSettings: firebase.auth.ActionCodeSettings
  ) => Promise<void> = null;

  public sendPasswordResetEmail: (
    email: string,
    actionCodeSettings?: firebase.auth.ActionCodeSettings|null
  ) => Promise<void> = null;

  public setPersistence: (persistence: firebase.auth.Auth.Persistence) => Promise<void> = null;

  public signInAndRetrieveDataWithCredential: (
    credential: firebase.auth.AuthCredential
  ) => Promise<firebase.auth.UserCredential> = null;

  public signInAnonymously: () => Promise<firebase.auth.UserCredential> = null;

  public signInWithCredential: (
    credential: firebase.auth.AuthCredential
  ) => Promise<firebase.auth.UserCredential> = null;

  public signInWithCustomToken: (token: string) => Promise<firebase.auth.UserCredential> = null;

  public signInWithEmailAndPassword: (
    email: string,
    password: string
  ) => Promise<firebase.auth.UserCredential> = null;

  public signInWithPhoneNumber: (
    phoneNumber: string,
    applicationVerifier: firebase.auth.ApplicationVerifier
  ) => Promise<firebase.auth.ConfirmationResult> = null;

  public signInWithEmailLink: (
    email: string,
    emailLink?: string
  ) => Promise<firebase.auth.UserCredential> = null;

  public signInWithPopup: (
    provider: firebase.auth.AuthProvider
  ) => Promise<firebase.auth.UserCredential> = null;

  public signInWithRedirect: (provider: firebase.auth.AuthProvider) => Promise<void> = null;

  public signOut: () => Promise<void> = null;

  public updateCurrentUser: (user: firebase.User|null) => Promise<void> = null;

  public useDeviceLanguage: () => Promise<void> = null;

  public verifyPasswordResetCode: (code: string) => Promise<string> = null;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig: string|FirebaseAppConfig|null|undefined,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    const schedulers = new ɵAngularFireSchedulers(zone);
    const keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(schedulers);

    const auth = of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => zone.runOutsideAngular(() => import('firebase/auth'))),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => zone.runOutsideAngular(() => app.auth())),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    if (isPlatformServer(platformId)) {

      this.authState = this.user = this.idToken = this.idTokenResult = of(null);

    } else {

      // HACK, as we're exporting auth.Auth, rather than auth, developers importing firebase.auth
      //       (e.g, `import { auth } from 'firebase/app'`) are getting an undefined auth object unexpectedly
      //       as we're completely lazy. Let's eagerly load the Auth SDK here.
      //       There could potentially be race conditions still... but this greatly decreases the odds while
      //       we reevaluate the API.
      const _ = auth.pipe(first()).subscribe();

      this.authState = auth.pipe(
        switchMap(auth => auth.getRedirectResult().then(() => auth)),
        switchMap(auth => zone.runOutsideAngular(() => new Observable<User|null>(auth.onAuthStateChanged.bind(auth)))),
        keepUnstableUntilFirst
      );

      this.user = auth.pipe(
        switchMap(auth => auth.getRedirectResult().then(() => auth)),
        switchMap(auth => zone.runOutsideAngular(() => new Observable<User|null>(auth.onIdTokenChanged.bind(auth)))),
        keepUnstableUntilFirst
      );

      this.idToken = this.user.pipe(
        switchMap(user => user ? from(user.getIdToken()) : of(null))
      );

      this.idTokenResult = this.user.pipe(
        switchMap(user => user ? from(user.getIdTokenResult()) : of(null))
      );

    }

    return ɵlazySDKProxy(this, auth, zone);

  }

}
