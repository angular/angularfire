import * as firebase from 'firebase/app';
import 'firebase/auth';
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { observeOn } from 'rxjs/operator/observeOn';
import { FirebaseApp, ZoneScheduler } from 'angularfire2';

export type Auth = firebase.auth.Auth;

@Injectable()
export class AngularFireAuth {

  /**
   * Firebase Auth instance
   */
  auth: firebase.auth.Auth;

  /**
   * Observable of authentication state; as of 4.0 this is only triggered via sign-in/out
   */
  authState: Observable<firebase.User>;

  /**
   * Observable of the signed-in user's ID token; which includes sign-in, sign-out, and token refresh events
   */
  idToken: Observable<firebase.User>;

  constructor(public app: FirebaseApp) {
    this.authState = FirebaseAuthStateObservable(app);
    this.idToken = FirebaseIdTokenObservable(app);
    this.auth = app.auth();
  }

}

/**
 * Create an Observable of Firebase authentication state. Each event is called
 * within the current zone.
 * @param app - Firebase App instance
 */
export function FirebaseAuthStateObservable(app: FirebaseApp): Observable<firebase.User> {
  const authState = Observable.create((observer: Observer<firebase.User>) => {
    app.auth().onAuthStateChanged(
      (user?: firebase.User) => observer.next(user!),
      (error: firebase.auth.Error) => observer.error(error),
      () => observer.complete()
    );
  });
  return observeOn.call(authState, new ZoneScheduler(Zone.current));
}

/**
 * Create an Observable of Firebase ID token. Each event is called
 * within the current zone.
 * @param app - Firebase App instance
 */
export function FirebaseIdTokenObservable(app: FirebaseApp): Observable<firebase.User> {
  const idToken = Observable.create((observer: Observer<firebase.User>) => {
    app.auth().onIdTokenChanged(
      (user?: firebase.User) => observer.next(user!),
      (error: firebase.auth.Error) => observer.error(error),
      () => observer.complete()
    )
  });
  return observeOn.call(idToken, new ZoneScheduler(Zone.current));
}
