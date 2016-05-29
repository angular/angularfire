import {Injectable, Inject} from '@angular/core';
import {
  AuthBackend,
  FirebaseAuthState,
  AuthProviders,
  AuthMethods,
  authDataToAuthState,
  OAuth2Credentials,
  OAuthCredentials
} from './auth_backend';
import {FirebaseRef} from '../tokens';
import {isPresent} from '../utils/utils';
import * as Firebase from 'firebase';

@Injectable()
export class FirebaseSdkAuthBackend extends AuthBackend {
  constructor( @Inject(FirebaseRef) private _fbRef: Firebase,
    private _webWorkerMode = false) {
    super();
  }

  createUser(creds: FirebaseCredentials): Promise<FirebaseAuthData> {
    return new Promise<FirebaseAuthData>((resolve, reject) => {
      this._fbRef.createUser(creds, (err, authData) => {
        if (err) {
          reject(err);
        } else {
          resolve(authData);
        }
      });
    });
  }

  onAuth(onComplete: (authData: FirebaseAuthData) => void): void {
    this._fbRef.onAuth(onComplete);
  }

  getAuth(): FirebaseAuthData {
    return this._fbRef.getAuth();
  }

  unauth(): void {
    this._fbRef.unauth();
  }

  authWithCustomToken(token: string, options?: any): Promise<FirebaseAuthState> {
    let p = new Promise((res, rej) => {
      this._fbRef.authWithCustomToken(token, this._handleFirebaseAuthCb(res, rej, options), options);
    });

    return p;
  }

  authAnonymously(options?: any): Promise<FirebaseAuthState> {
    let p = new Promise((res, rej) => {
      this._fbRef.authAnonymously(this._handleFirebaseAuthCb(res, rej, options), options);
    });

    return p;
  }

  authWithPassword(credentials: FirebaseCredentials, options?: any)
    : Promise<FirebaseAuthState> {
    let p = new Promise((res, rej) => {
      this._fbRef.authWithPassword(credentials, this._handleFirebaseAuthCb(res, rej, options), options);
    });

    return p;
  }

  authWithOAuthPopup(provider: AuthProviders, options?: any): Promise<FirebaseAuthState> {
    let p = new Promise((res, rej) => {
      this._fbRef.authWithOAuthPopup(this._providerToString(provider),
        this._handleFirebaseAuthCb(res, rej, options), options);
    });

    return p;
  }

  /**
   * Authenticates a Firebase client using a redirect-based OAuth flow
   * NOTE: This promise will not be resolved if authentication is successful since the browser redirected.
   * You should subscribe to the FirebaseAuth object to listen succesful login
   */
  authWithOAuthRedirect(provider: AuthProviders, options?: any): Promise<FirebaseAuthState> {
    let p = new Promise((res, rej) => {
      this._fbRef.authWithOAuthRedirect(this._providerToString(provider),
        this._handleFirebaseAuthCb(res, rej, options), options);
    });

    return p;
  }

  authWithOAuthToken(provider: AuthProviders, credentialsObj: OAuthCredentials, options?: any)
    : Promise<FirebaseAuthState> {
    let p = new Promise((res, rej) => {
      let credentials = isPresent((<OAuth2Credentials>credentialsObj).token)
        ? (<OAuth2Credentials>credentialsObj).token
        : credentialsObj;
      this._fbRef.authWithOAuthToken(this._providerToString(provider), credentials,
        this._handleFirebaseAuthCb(res, rej, options), options);
    });

    return p;
  }

  resetPassword(credentials: FirebaseResetPasswordCredentials): Promise<void> {
    const p = new Promise<void>((res, rej) => {
      this._fbRef.resetPassword(credentials, this._handleFirebaseCb(res, rej));
    });
    return p;
  }

  changePassword(credentials: FirebaseChangePasswordCredentials): Promise<void> {
    const p = new Promise<void>((res, rej) => {
      this._fbRef.changePassword(credentials, this._handleFirebaseCb(res, rej));
    });
    return p;
  }

  changeEmail(credentials: FirebaseChangeEmailCredentials): Promise<void> {
    const p = new Promise<void>((res, rej) => {
      this._fbRef.changeEmail(credentials, this._handleFirebaseCb(res, rej));
    });
    return p;
  }

  private _handleFirebaseCb(res: Function, rej: Function): (err: any) => void {
    return function (err) {
      if (err) {
        return rej(err);
      } else {
        const args = Array.prototype.slice.call(arguments, 1);
        return res.apply(null, args);
      }
    };
  }

  private _handleFirebaseAuthCb(res: Function, rej: Function, options: any): (err: any, auth?: FirebaseAuthData) => void {
    return (err, auth?) => {
      if (err) {
        return rej(err);
      } else {
        if (!this._webWorkerMode)
          return res(authDataToAuthState(auth));
        else {
          if (isPresent(options) && isPresent(options.remember)) {
            // Add remember value in WebWorker mode so that the worker
            // can auth with the same value
            (<any>auth).remember = options.remember;
          }
          return res(auth);
        }
      }
    };
  }

  private _providerToString(provider: AuthProviders): string {
    switch (provider) {
      case AuthProviders.Github:
        return 'github';
      case AuthProviders.Twitter:
        return 'twitter';
      case AuthProviders.Facebook:
        return 'facebook';
      case AuthProviders.Google:
        return 'google';
      default:
        throw new Error(`Unsupported firebase auth provider ${provider}`);
    }
  }
}
