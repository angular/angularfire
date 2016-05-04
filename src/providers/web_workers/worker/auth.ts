import {Injectable, Inject} from '@angular/core';

// Import these from src/ until we have a specific import path for them
// https://github.com/angular/angular/issues/7419
import {
  ClientMessageBrokerFactory,
  ClientMessageBroker,
  FnArg,
  UiArguments
} from 'angular2/src/web_workers/shared/client_message_broker';
import {MessageBus} from 'angular2/src/web_workers/shared/message_bus';
import {PRIMITIVE} from 'angular2/src/web_workers/shared/serializer';

import {AUTH_CHANNEL, INITIAL_AUTH_CHANNEL} from '../shared/channels';
import {FirebaseRef} from '../../../tokens';
import {
  AuthBackend,
  FirebaseAuthState,
  AuthProviders,
  AuthMethods,
  authDataToAuthState,
  OAuth2Credentials,
  OAuthCredentials
} from '../../auth_backend';
import {isPresent} from '../../../utils/utils';
import * as Firebase from 'firebase';

@Injectable()
export class WebWorkerFirebaseAuth extends AuthBackend {
  private _messageBroker: ClientMessageBroker;
  private _authMetadata: {[key: string]: FirebaseAuthData} = {};
  private _authCbs: Array<(authData: FirebaseAuthData) => void> = [];
  private _gotAuth = false;

  constructor (@Inject(FirebaseRef) private _fbRef: Firebase, brokerFactory: ClientMessageBrokerFactory,
              bus: MessageBus) {
    super();
    this._messageBroker = brokerFactory.createMessageBroker(AUTH_CHANNEL);
    let args = new UiArguments('getAuth');
    this._messageBroker.runOnService(args, PRIMITIVE).then((authData: FirebaseAuthDataWithRemember) => {
      this._gotAuth = true;
      if (authData != null) {
        this._handleAuthPromise(<FirebaseAuthDataWithRemember> authData);
      }
    });
  }

  onAuth (onComplete: (authData: FirebaseAuthData) => void): void {
    this._fbRef.onAuth((authData) => {
      if (!this._gotAuth) return false;
      if (isPresent(authData) && isPresent(this._authMetadata[authData.token])) {
        authData = this._authMetadata[authData.token];
      }
      onComplete(authData);
    });
  }

  getAuth(): FirebaseAuthData {
    return this._fbRef.getAuth();
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

  authAnonymously(options?: any): Promise<FirebaseAuthState> {
    let args = new UiArguments('authAnonymously', [new FnArg(options, PRIMITIVE)]);
    let uiAuthPromise = this._messageBroker.runOnService(args, PRIMITIVE);
    return this._doAuth(uiAuthPromise);
  }

  authWithCustomToken(token: string, options?: any): Promise<FirebaseAuthState> {
    return new Promise((res, rej) => {
      this._fbRef.authWithCustomToken(token, (err, authData) => {
        if (err)
          return rej(err);
        else
          return res(authDataToAuthState(authData));
      });
    });
  }
  authWithPassword(credentials: FirebaseCredentials, options?: any): Promise<FirebaseAuthState> {
    let args = new UiArguments('authWithPassword',
                               [new FnArg(credentials, PRIMITIVE), new FnArg(options, PRIMITIVE)]);
    let uiAuthPromise = this._messageBroker.runOnService(args, PRIMITIVE);
    return this._doAuth(uiAuthPromise);
  }
  authWithOAuthPopup(provider: AuthProviders, options?: any): Promise<FirebaseAuthState> {
    let args = new UiArguments('authWithOAuthPopup',
                               [new FnArg(provider, PRIMITIVE), new FnArg(options, PRIMITIVE)]);
    let uiAuthPromise = this._messageBroker.runOnService(args, PRIMITIVE);
    return this._doAuth(uiAuthPromise);
  }
  authWithOAuthRedirect(provider: AuthProviders, options?: any): Promise<FirebaseAuthState> {
    let args = new UiArguments('authWithOAuthRedirect',
                               [new FnArg(provider, PRIMITIVE), new FnArg(options, PRIMITIVE)]);
    let uiAuthPromise = this._messageBroker.runOnService(args, PRIMITIVE);
    return this._doAuth(uiAuthPromise);
  }
  authWithOAuthToken(provider: AuthProviders, credentialsObj: OAuthCredentials, options?: any)
  : Promise<FirebaseAuthState> {
    let args = new UiArguments('authWithOAuthToken',
                               [new FnArg(provider, PRIMITIVE), 
                                new FnArg(credentialsObj, PRIMITIVE),
                                new FnArg(options, PRIMITIVE)]);
    let uiAuthPromise = this._messageBroker.runOnService(args, PRIMITIVE);
    return this._doAuth(uiAuthPromise);
  }

  unauth(): void {
    let args = new UiArguments('unauth');
    this._messageBroker.runOnService(args, null);
    this._fbRef.unauth();
  }

  /**
   * Performs custom token auth using the token returned from the UI.
   * Saves the associated metatadata to be emited by onAuth.
   */
  private _doAuth(promise: Promise<FirebaseAuthDataWithRemember>): Promise<FirebaseAuthState> {
    return promise.then((data) => this._handleAuthPromise(data));
  }

  private _handleAuthPromise(authData: FirebaseAuthDataWithRemember): Promise<FirebaseAuthState> {
    this._authMetadata[authData.token] = authData;
    return new Promise((res, rej) => {
      this._fbRef.authWithCustomToken(authData.token, (err, _) => {
        if (err)
          return rej (err);
        else 
          return res(authDataToAuthState(authData));
      }, {remember: authData.remember});
    });
  }
}

interface FirebaseAuthDataWithRemember extends FirebaseAuthData {
  remember: string;
}
