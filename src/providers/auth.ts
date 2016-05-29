import {Provider, Inject, provide, Injectable, Optional} from '@angular/core';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {FirebaseRef, FirebaseAuthConfig} from '../tokens';
import {isPresent} from '../utils/utils';
import * as utils from '../utils/utils';
import {
  AuthBackend,
  AuthProviders,
  AuthMethods,
  OAuthCredentials,
  OAuth1Credentials,
  OAuth2Credentials,
  AuthCredentials,
  FirebaseAuthState,
  AuthConfiguration,
  FirebaseAuthDataAllProviders,
  authDataToAuthState
} from './auth_backend';

const kBufferSize = 1;

export const firebaseAuthConfig = (config: AuthConfiguration): Provider => {
  return provide(FirebaseAuthConfig, {
    useValue: config
  });
};

@Injectable()
export class FirebaseAuth extends ReplaySubject<FirebaseAuthState> {
  constructor(private _authBackend: AuthBackend,
    @Optional() @Inject(FirebaseAuthConfig) private _config?: AuthConfiguration) {
    super(kBufferSize);

    this._authBackend.onAuth((authData) => this._emitAuthData(authData));
  }

  public login(config?: AuthConfiguration): Promise<FirebaseAuthState>;
  public login(credentials?: FirebaseCredentials): Promise<FirebaseAuthState>;
  public login(credentials: AuthCredentials, config?: AuthConfiguration): Promise<FirebaseAuthState>;
  public login(obj1?: any, obj2?: AuthConfiguration): Promise<FirebaseAuthState> {
    let config: AuthConfiguration = null;
    let credentials: AuthCredentials = null;
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

    if (!isPresent(config.method)) {
      return this._reject('You must provide a login method');
    }
    let providerMethods = [AuthMethods.Popup, AuthMethods.Redirect, AuthMethods.OAuthToken];
    if (providerMethods.indexOf(config.method) != -1) {
      if (!isPresent(config.provider)) {
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
        return this._authBackend.authWithOAuthPopup(config.provider, this._scrubConfig(config));
      case AuthMethods.Redirect:
        return this._authBackend.authWithOAuthRedirect(config.provider, this._scrubConfig(config));
      case AuthMethods.Anonymous:
        return this._authBackend.authAnonymously(this._scrubConfig(config));
      case AuthMethods.Password:
        return this._authBackend.authWithPassword(<FirebaseCredentials>credentials, this._scrubConfig(config, false));
      case AuthMethods.OAuthToken:
        return this._authBackend.authWithOAuthToken(config.provider, <OAuthCredentials>credentials,
          this._scrubConfig(config));
      case AuthMethods.CustomToken:
        return this._authBackend.authWithCustomToken((<OAuth2Credentials>credentials).token,
          this._scrubConfig(config, false));
    }
  }

  public logout(): void {
    if (this._authBackend.getAuth() !== null) {
      this._authBackend.unauth();
    }
  }

  public getAuth(): FirebaseAuthData {
    return this._authBackend.getAuth();
  }

  public createUser(credentials: FirebaseCredentials): Promise<FirebaseAuthData> {
    return this._authBackend.createUser(credentials);
  }

  public resetPassword(credentials: FirebaseResetPasswordCredentials): Promise<void> {
    return this._authBackend.resetPassword(credentials);
  }

  public changePassword(credentials: FirebaseChangePasswordCredentials): Promise<void> {
    return this._authBackend.changePassword(credentials);
  }

  public changeEmail(credentials: FirebaseChangeEmailCredentials): Promise<void> {
    return this._authBackend.changeEmail(credentials);
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

  private _reject(msg: string): Promise<FirebaseAuthState> {
    return new Promise((res, rej) => {
      return rej(msg);
    });
  }

  private _scrubConfig(config: AuthConfiguration, scrubProvider = true): any {
    let scrubbed = Object.assign({}, config);
    if (scrubProvider) {
      delete scrubbed.provider;
    }
    delete scrubbed.method;
    return scrubbed;
  }


  private _emitAuthData(authData: FirebaseAuthDataAllProviders): void {
    if (authData == null) {
      this.next(null);
    } else {
      this.next(authDataToAuthState(authData));
    }
  }
}
