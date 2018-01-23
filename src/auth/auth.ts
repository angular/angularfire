import { FirebaseAuth, User } from '@firebase/auth-types';
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { observeOn } from 'rxjs/operator/observeOn';
import { FirebaseApp, ZoneScheduler } from 'angularfire2';

import 'rxjs/add/operator/switchMap';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/fromPromise';

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

  constructor(public app: FirebaseApp) {
    this.auth = app.auth();

    const authState$ = new Observable(subscriber => {
      const unsubscribe = this.auth.onAuthStateChanged(subscriber);
      return { unsubscribe };
    });
    this.authState = observeOn.call(authState$, new ZoneScheduler(Zone.current));

    const idToken$ = new Observable<User|null>(subscriber => {
      const unsubscribe = this.auth.onIdTokenChanged(subscriber);
      return { unsubscribe };
    }).switchMap(user => {
      return user ? Observable.fromPromise(user.getIdToken()) : Observable.of(null)
    });
    this.idToken = observeOn.call(idToken$, new ZoneScheduler(Zone.current));
  }

}
