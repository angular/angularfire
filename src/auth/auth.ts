import * as firebase from 'firebase';
import { Provider, Inject, Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { FirebaseApp, FirebaseAuthConfig, WindowLocation } from '../tokens';
import * as utils from '../utils';
import {
  authDataToAuthState,
  AuthBackend,
  AuthProviders,
  AuthMethods,
  EmailPasswordCredentials,
  AuthConfiguration,
  FirebaseAuthState,
  stripProviderId
} from './auth_backend';
import { mergeMap } from 'rxjs/operator/mergeMap';
import { of as observableOf } from 'rxjs/observable/of';
import { map } from 'rxjs/operator/map';

const kBufferSize = 1;

export const firebaseAuthConfig = (config: AuthConfiguration): any => {
  return { provide: FirebaseAuthConfig, useValue: config }
};

@Injectable()
export class AngularFireAuth extends ReplaySubject<FirebaseAuthState> {
  private _credentialCache: {[key:string]: any} = {};
  constructor(private _authBackend: AuthBackend,
    @Inject(WindowLocation) loc: any,
    @Optional() @Inject(FirebaseAuthConfig) private _config?: AuthConfiguration) {
    super(kBufferSize);

    let firstPass = true;
    let onAuth = this._authBackend.onAuth();

    mergeMap.call(onAuth, (authState: FirebaseAuthState) => {
      if (firstPass) {
        firstPass = false;
        if(['http:', 'https:'].indexOf(loc.protocol) > -1) {
          // Only call getRedirectResult() in a browser
          return map.call(this._authBackend.getRedirectResult(), (userCredential: firebase.auth.UserCredential) => {
              if (userCredential && userCredential.credential) {
                authState = attachCredentialToAuthState(authState, userCredential.credential, userCredential.credential.provider);
                this._credentialCache[userCredential.credential.provider] = userCredential.credential;
              }
              return authState;
            });
        }

      }
      return observableOf(authState);
    })
    .subscribe((authData: FirebaseAuthState) => this._emitAuthData(authData));
  }

  public login(config?: AuthConfiguration): firebase.Promise<FirebaseAuthState>;
  // If logging in with email and password
  public login(credentials?: EmailPasswordCredentials | firebase.auth.AuthCredential | string): firebase.Promise<FirebaseAuthState>;
  public login(credentials: EmailPasswordCredentials | firebase.auth.AuthCredential | string, config?: AuthConfiguration): firebase.Promise<FirebaseAuthState>;
  public login(obj1?: any, obj2?: AuthConfiguration): firebase.Promise<FirebaseAuthState> {
    let config: AuthConfiguration = null;
    let credentials: EmailPasswordCredentials | firebase.auth.AuthCredential | string = null;
    if (arguments.length > 2) {
      return this._reject('Login only accepts a maximum of two arguments.');
    } else if (arguments.length == 2) {
      credentials = obj1;
      config = obj2;
    } else if (arguments.length == 1) {
      // Check if obj1 is password credentials
      if (obj1.password && obj1.email) {
        credentials = obj1;
        config = {};
      } else {
        config = obj1;
      }
    }
    config = this._mergeConfigs(config);

    if (utils.isNil(config.method)) {
      return this._reject('You must provide a login method');
    }
    let providerMethods = [AuthMethods.Popup, AuthMethods.Redirect, AuthMethods.OAuthToken];
    if (providerMethods.indexOf(config.method) != -1) {
      if (utils.isNil(config.provider)) {
        return this._reject('You must include a provider to use this auth method.');
      }
    }
    let credentialsMethods = [AuthMethods.Password, AuthMethods.OAuthToken, AuthMethods.CustomToken];
    if (credentialsMethods.indexOf(config.method) != -1) {
      if (!credentials) {
        return this._reject('You must include credentials to use this auth method.');
      }
    }

    switch (config.method) {
      case AuthMethods.Popup:
        return this._authBackend.authWithOAuthPopup(config.provider, this._scrubConfig(config))
          .then((userCredential: firebase.auth.UserCredential) => {
            // Incorrect type information
            this._credentialCache[userCredential.credential.provider] = userCredential.credential;
            return authDataToAuthState(userCredential.user, (<any>userCredential).credential);
          });
      case AuthMethods.Redirect:
        // Gets around typings issue since this method doesn't resolve with a user.
        // The method really only does anything with an error, since it redirects.
        return <Promise<FirebaseAuthState>>(<any>this._authBackend).authWithOAuthRedirect(config.provider, this._scrubConfig(config));
      case AuthMethods.Anonymous:
        return this._authBackend.authAnonymously(this._scrubConfig(config));
      case AuthMethods.Password:
        return this._authBackend.authWithPassword(<EmailPasswordCredentials>credentials);
      case AuthMethods.OAuthToken:
        return this._authBackend.authWithOAuthToken(<firebase.auth.AuthCredential>credentials,
          this._scrubConfig(config));
      case AuthMethods.CustomToken:
        return this._authBackend.authWithCustomToken(<string>credentials);
    }
  }

  public logout(): Promise<void> {
    return this._authBackend.unauth();
  }

  public getAuth(): FirebaseAuthState {
    console.warn(`WARNING: the getAuth() API has changed behavior since adding support for Firebase 3.
    This will return null for the initial value when the page loads, even if the user is actually logged in.
    Please observe the actual authState asynchronously by subscribing to the auth service: af.auth.subscribe().
    The getAuth method will be removed in future releases`);
    return this._authBackend.getAuth()
  }

  public createUser(credentials: EmailPasswordCredentials): firebase.Promise<FirebaseAuthState> {
    return this._authBackend.createUser(credentials);
  }

  /**
   * Merges the config object that is passed in with the configuration
   * provided through DI. Giving precendence to the one that was passed.
   */
  private _mergeConfigs(config: AuthConfiguration): AuthConfiguration {
    if (this._config == null)
      return config;

    return Object.assign({}, this._config, config);
  }

  private _reject(msg: string): firebase.Promise<FirebaseAuthState> {
    return (<Promise<FirebaseAuthState>>new Promise((res, rej) => {
      return rej(msg);
    }));
  }

  private _scrubConfig(config: AuthConfiguration, scrubProvider = true): any {
    let scrubbed = Object.assign({}, config);
    if (scrubProvider) {
      delete scrubbed.provider;
    }
    delete scrubbed.method;
    return scrubbed;
  }


  private _emitAuthData(authData: FirebaseAuthState): void {
    if (authData == null) {
      this.next(null);
    } else {
      if (authData.auth && authData.auth.providerData && authData.auth.providerData[0]) {
        let providerId = authData.auth.providerData[0].providerId;
        let providerCredential = this._credentialCache[providerId];
        if (providerCredential) {
          authData = attachCredentialToAuthState(authData, providerCredential, providerId);
        }
      }

      this.next(authData);
    }
  }
}

function attachCredentialToAuthState (authState: FirebaseAuthState, credential, providerId: string): FirebaseAuthState {
  if (!authState) return authState;
  // TODO make authState immutable
  authState[stripProviderId(providerId)] = credential;
  return authState;
}
