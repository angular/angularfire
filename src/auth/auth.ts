import * as firebase from 'firebase/app';
import * as utils from '../utils';
import 'firebase/auth';
import { Injectable, NgZone } from '@angular/core';
import { Auth } from '../interfaces';
import { Observable } from 'rxjs/Observable';
import { observeOn } from 'rxjs/operator/observeOn';
import { FirebaseApp } from '../app/index';

@Injectable()
export class AngularFireAuth {

  /**
   * Firebase Auth instance
   */
  auth: firebase.auth.Auth;
  
  /**
   * Observable of authentication state
   */
  authState: Observable<firebase.User>;

  constructor(public app: FirebaseApp) {
    this.authState = FirebaseAuthStateObservable(app);
  }

}

/**
 * Create an Observable of Firebase authentication state. Each event is called
 * within the current zone.
 * @param app - Firebase App instance
 */
export function FirebaseAuthStateObservable(app: FirebaseApp) {
  const authState = Observable.create(firebase.auth().onAuthStateChanged);
  return observeOn.call(authState, new utils.ZoneScheduler(Zone.current));
}
