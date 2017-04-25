import * as firebase from 'firebase/app';
import * as utils from '../utils';
import 'firebase/auth';
import { Injectable, NgZone } from '@angular/core';
import { Auth } from '../interfaces';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { observeOn } from 'rxjs/operator/observeOn';
import { FirebaseApp } from '../app/index';

@Injectable()
export class AngularFireAuth {

  /**
   * Firebase Auth instance
   */
  Auth: firebase.auth.Auth;

  /**
   * Observable of authentication state
   */
  user: Observable<firebase.User>;

  constructor(public app: FirebaseApp) {
    this.user = FirebaseAuthStateObservable(app);
    this.Auth = app.auth();
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
      (user?: firebase.User) => observer.next(user),
      (error: firebase.auth.Error) => observer.error(error),
      () => observer.complete()
    );
  });
  return observeOn.call(authState, new utils.ZoneScheduler(Zone.current));
}
