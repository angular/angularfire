import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { FirebaseApp } from '../tokens';
import { isPresent } from '../utils';
import { auth } from 'firebase';
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
} = auth;

import 'rxjs/add/operator/map';
import 'rxjs/add/observable/fromPromise';

@Injectable()
export class FirebaseSdkAuthBackend extends AuthBackend {
  _fbAuth: firebase.auth.Auth;
  constructor( @Inject(FirebaseApp) _fbApp: firebase.app.App,
    private _webWorkerMode = false) {
    super();
    this._fbAuth = _fbApp.auth();
  }

  createUser(creds: EmailPasswordCredentials): Promise<FirebaseAuthState> {
    return Promise.resolve(this._fbAuth.createUserWithEmailAndPassword(creds.email, creds.password))
      .then((user: firebase.User) => authDataToAuthState(user));
  }

  getAuth(): FirebaseAuthState {
    return authDataToAuthState(this._fbAuth.currentUser);
  }

  onAuth(): Observable<FirebaseAuthState> {
    // TODO: assumes this will accept an RxJS observer
    return Observable.create((observer: Observer<FirebaseAuthState>) => {
      return this._fbAuth.onAuthStateChanged(observer);
    })
    .map((user: firebase.User) => {
      if (!user) return null;
      return authDataToAuthState(user, user.providerData[0]);
    });
  }

  unauth(): void {
    Promise.resolve(this._fbAuth.signOut());
  }

  authWithCustomToken(token: string): Promise<FirebaseAuthState> {
    return Promise.resolve(this._fbAuth.signInWithCustomToken(token))
      .then((user: firebase.User) => authDataToAuthState(user));
  }

  authAnonymously(): Promise<FirebaseAuthState> {
    return Promise.resolve(this._fbAuth.signInAnonymously())
      .then((user: firebase.User) => authDataToAuthState(user));
  }

  authWithPassword(creds: EmailPasswordCredentials): Promise<FirebaseAuthState> {
    return Promise.resolve(this._fbAuth.signInWithEmailAndPassword(creds.email, creds.password))
      .then((user: firebase.User) => authDataToAuthState(user));
  }

  authWithOAuthPopup(provider: AuthProviders, options?: any): Promise<firebase.auth.UserCredential> {
    var providerFromFirebase = <FirebaseOAuthProvider>this._enumToAuthProvider(provider);
    if (options.scope) {
      options.scope.forEach(scope => providerFromFirebase.addScope(scope));
    }
    return Promise.resolve(this._fbAuth.signInWithPopup(providerFromFirebase));
  }

  /**
   * Authenticates a Firebase client using a redirect-based OAuth flow
   * NOTE: This promise will not be resolved if authentication is successful since the browser redirected.
   * You should subscribe to the FirebaseAuth object to listen succesful login
   */
  authWithOAuthRedirect(provider: AuthProviders, options?: any): Promise<void> {
    return Promise.resolve(this._fbAuth.signInWithRedirect(this._enumToAuthProvider(provider)));
  }

  authWithOAuthToken(credential: firebase.auth.AuthCredential): Promise<FirebaseAuthState> {
    return Promise.resolve(this._fbAuth.signInWithCredential(credential))
      .then((user: firebase.User) => authDataToAuthState(user));
  }

  getRedirectResult(): Observable<firebase.auth.UserCredential> {
    return Observable.fromPromise(Promise.resolve(this._fbAuth.getRedirectResult()));
  }

  private _enumToAuthProvider(providerId: AuthProviders): firebase.auth.AuthProvider | FirebaseOAuthProvider {
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
