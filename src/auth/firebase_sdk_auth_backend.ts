import * as firebase from 'firebase/app';
import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { FirebaseApp } from '../angularfire2';
import { ZoneScheduler } from '../utils';
import {
  authDataToAuthState,
  AuthBackend,
  AuthProviders,
  AuthMethods,
  FirebaseAuthState,
  EmailPasswordCredentials
} from './auth_backend';

const {
  FacebookAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  TwitterAuthProvider
} = firebase.auth;

import { map } from 'rxjs/operator/map';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { observeOn } from 'rxjs/operator/observeOn';

@Injectable()
export class FirebaseSdkAuthBackend extends AuthBackend {
  _fbAuth: firebase.auth.Auth;
  /**
   * TODO(jeffbcross): change _fbApp type back to firebase.app.App
   * An issue with AoT compiler does not allow interface types on
   * constructor parameters, even when used in conjunction with @Inject.
   * https://github.com/angular/angular/issues/12631
   * https://github.com/angular/angularfire2/issues/653
   **/
  constructor(private _fbApp: FirebaseApp) {
    super();
    this._fbAuth = _fbApp.auth();
  }

  createUser(creds: EmailPasswordCredentials): Promise<FirebaseAuthState> {
    return castPromise<firebase.User>(this._fbAuth.createUserWithEmailAndPassword(creds.email, creds.password))
      .then((user: firebase.User) => authDataToAuthState(user));
  }

  getAuth(): FirebaseAuthState {
    return authDataToAuthState(this._fbAuth.currentUser);
  }

  onAuth(): Observable<FirebaseAuthState> {
    let stateChange = Observable.create((observer: Observer<FirebaseAuthState>) => {
      return this._fbAuth.onAuthStateChanged(observer);
    });
    let authState = map.call(stateChange, (user: firebase.User) => {
      if (!user) return null;
      return authDataToAuthState(user, user.providerData[0]);
    });

    /**
     * TODO: since the auth service automatically subscribes to this before
     * any user, it will run in the Angular zone, instead of the subscription
     * zone. The auth service should be refactored to capture the subscription
     * zone and not use a ReplaySubject.
    **/
    return observeOn.call(authState, new ZoneScheduler(Zone.current));
  }

  unauth(): Promise<void> {
    return <Promise<void>>this._fbAuth.signOut();
  }

  authWithCustomToken(token: string): Promise<FirebaseAuthState> {
    return castPromise<firebase.User>((this._fbAuth.signInWithCustomToken(token)))
      .then((user: firebase.User) => authDataToAuthState(user));
  }

  authAnonymously(): Promise<FirebaseAuthState> {
    return castPromise<firebase.User>(this._fbAuth.signInAnonymously())
      .then((user: firebase.User) => authDataToAuthState(user));
  }

  authWithPassword(creds: EmailPasswordCredentials): Promise<FirebaseAuthState> {
    return castPromise<firebase.User>(this._fbAuth.signInWithEmailAndPassword(creds.email, creds.password))
      .then((user: firebase.User) => authDataToAuthState(user));
  }

  authWithOAuthPopup(provider: AuthProviders, options?: any): Promise<firebase.auth.UserCredential> {
    var providerFromFirebase:any = this._enumToAuthProvider(provider);
    if (options.scope) {
      options.scope.forEach(scope => providerFromFirebase.addScope(scope));
    }
    return castPromise<firebase.auth.UserCredential>(this._fbAuth.signInWithPopup(providerFromFirebase));
  }

  /**
   * Authenticates a Firebase client using a redirect-based OAuth flow
   * NOTE: This promise will not be resolved if authentication is successful since the browser redirected.
   * You should subscribe to the FirebaseAuth object to listen succesful login
   */
  authWithOAuthRedirect(provider: AuthProviders, options?: any): Promise<void> {
    return castPromise<void>(this._fbAuth.signInWithRedirect(this._enumToAuthProvider(provider)));
  }

  authWithOAuthToken(credential: firebase.auth.AuthCredential): Promise<FirebaseAuthState> {
    return castPromise<firebase.User>(this._fbAuth.signInWithCredential(credential))
      .then((user: firebase.User) => authDataToAuthState(user));
  }

  getRedirectResult(): Observable<firebase.auth.UserCredential> {
    return fromPromise(castPromise<firebase.auth.UserCredential>(this._fbAuth.getRedirectResult()));
  }

  private _enumToAuthProvider(providerId: AuthProviders): any {
    switch (providerId) {
      case AuthProviders.Github:
        return new GithubAuthProvider();
      case AuthProviders.Twitter:
        return new TwitterAuthProvider();
      case AuthProviders.Facebook:
        return new FacebookAuthProvider();
      case AuthProviders.Google:
        return new GoogleAuthProvider();
      default:
        throw new Error(`Unsupported firebase auth provider ${providerId}`);
    }
  }
}

// Cast Firebase promises as Zone-patched Promises
function castPromise<T>(promiseLike: PromiseLike<T>): Promise<T> {
  return Promise.resolve(promiseLike) as Promise<T>;
}
