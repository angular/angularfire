import { FirebaseAuth, User } from '@firebase/auth-types';
import { FirebaseOptions } from '@firebase/app-types';
import { Injectable, Inject, Optional, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { observeOn } from 'rxjs/operator/observeOn';

import { FirebaseAppConfig, FirebaseAppName, _firebaseAppFactory, FirebaseZoneScheduler } from 'angularfire2';

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

  constructor(
    @Inject(FirebaseAppConfig) config:FirebaseOptions,
    @Optional() @Inject(FirebaseAppName) name:string,
    private zone: NgZone
  ) {
    this.auth = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(config, name);
      return app.auth();
    });

    const authState = new Observable(subscriber => {
      return zone.runOutsideAngular(() => {
        const unsubscribe = this.auth.onAuthStateChanged(subscriber);
        return { unsubscribe };
      });
    });
    this.authState = observeOn.call(authState, new FirebaseZoneScheduler(zone));

    const idToken = new Observable(subscriber => {
      return zone.runOutsideAngular(() => { 
        const unsubscribe = this.auth.onIdTokenChanged(subscriber);
        return { unsubscribe };
      });
    }).switchMap((user:User|null) => {
      return user ? Observable.fromPromise(user.getIdToken()) : Observable.of(null)
    });
    this.idToken = observeOn.call(idToken, new FirebaseZoneScheduler(zone));
  }

}
