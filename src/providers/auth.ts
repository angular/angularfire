import {Provider, Inject, provide, Injectable, Optional} from 'angular2/core';
import {ReplaySubject} from 'rxjs/subject/ReplaySubject';
import {FirebaseRef, FirebaseAuthConfig} from '../tokens';
import {isPresent} from '../utils/utils';

import * as Firebase from 'firebase';

const kBufferSize = 1;

export enum AuthProviders {
  Github,
  Twitter,
  Facebook,
  Google,
  Password,
  Anonymous,
  Custom
};

export enum AuthMethods {
  Popup,
  Redirect,
  Anonymous,
  Password,
  OAuthToken,
  CustomToken
};

export const firebaseAuthConfig = (config: AuthConfiguration): Provider => {
  return provide(FirebaseAuthConfig, {
    useValue: config
  });
};

@Injectable()
export class FirebaseAuth extends ReplaySubject<FirebaseAuthState> {
  constructor (@Inject(FirebaseRef) private _fbRef: Firebase,
               @Optional() @Inject(FirebaseAuthConfig) private _config?: AuthConfiguration) {
    super (kBufferSize);

    this._fbRef.onAuth((authData) => this._emitAuthData(authData));
  }

  public login(config?: AuthConfiguration): Promise<FirebaseAuthState>;
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
      config = obj1;
    }
    config = this._mergeConfigs(config);

    if (!isPresent(config.method)) {
      return this._reject('You must provide a login method');
    }
    let providerMethods = [AuthMethods.Popup, AuthMethods.Redirect, AuthMethods.OAuthToken];
    if (providerMethods.indexOf(config.method) != -1){
        if (!isPresent(config.provider)) {
          return this._reject('You must include a provider to use this auth method.');
        }
    }
    let credentialsMethods = [AuthMethods.Password, AuthMethods.OAuthToken, AuthMethods.CustomToken];
    if (credentialsMethods.indexOf(config.method) != -1){
      if (!credentials) {
        return this._reject('You must include credentials to use this auth method.');
      }
    }

    switch (config.method) {
      case AuthMethods.Popup:
        return this._authWithOAuthPopup(config.provider, this._scrubConfig(config));
      case AuthMethods.Redirect:
        return this._authWithOAuthRedirect(config.provider, this._scrubConfig(config));
      case AuthMethods.Anonymous:
        return this._authAnonymously(this._scrubConfig(config));
      case AuthMethods.Password:
        return this._authWithPassword(<FirebaseCredentials> credentials, this._scrubConfig(config, false));
      case AuthMethods.OAuthToken:
        return this._authWithOAuthToken(config.provider, <OAuthCredentials> credentials,
                                         this._scrubConfig(config));
      case AuthMethods.CustomToken:
        return this._authWithCustomToken((<OAuth2Credentials> credentials).token,
                                         this._scrubConfig(config, false));
    }
  }

  public logout(): void {
    if (this._fbRef.getAuth() !== null) {
      this._fbRef.unauth();
    }
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
      return rej (msg);
    });
  }

  private _scrubConfig (config: AuthConfiguration, scrubProvider = true): any {
    let scrubbed = Object.assign ({}, config);
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
      this.next(this._authDataToAuthState(authData));
    }
  }

  private _authWithCustomToken(token: string, options?: any): Promise<FirebaseAuthState> {
    let p = new Promise((res, rej) => {
      this._fbRef.authWithCustomToken(token, this._handleFirebaseCb(res, rej), options);
    });

    return p;
  }

  private _authAnonymously(options?: any): Promise<FirebaseAuthState> {
    let p = new Promise((res, rej) => {
      this._fbRef.authAnonymously(this._handleFirebaseCb(res, rej), options);
    });

    return p;
  }

  private _authWithPassword(credentials: FirebaseCredentials, options?: any)
    : Promise<FirebaseAuthState> {
    let p = new Promise((res, rej) => {
      this._fbRef.authWithPassword(credentials, this._handleFirebaseCb(res, rej), options);
    });

    return p;
  }

  private _authWithOAuthPopup(provider: AuthProviders, options?: any): Promise<FirebaseAuthState> {
    let p = new Promise((res, rej) => {
      this._fbRef.authWithOAuthPopup(this._providerToString(provider),
                                     this._handleFirebaseCb(res, rej), options);
    });

    return p;
  }

  /**
   * Authenticates a Firebase client using a redirect-based OAuth flow
   * NOTE: This promise will not be resolved if authentication is successful since the browser redirected.
   * You should subscribe to the FirebaseAuth object to listen succesful login
   */
  private _authWithOAuthRedirect(provider: AuthProviders, options?: any): Promise<FirebaseAuthState> {
    let p = new Promise((res, rej) => {
      this._fbRef.authWithOAuthRedirect(this._providerToString(provider),
                                        this._handleFirebaseCb(res, rej), options);
    });

    return p;
  }

  private _authWithOAuthToken(provider: AuthProviders, credentialsObj: OAuthCredentials, options?: any)
  : Promise<FirebaseAuthState> {
    let p = new Promise((res, rej) => {
      let credentials = isPresent((<OAuth2Credentials>credentialsObj).token)
                        ? (<OAuth2Credentials> credentialsObj).token 
                        : credentialsObj;
      this._fbRef.authWithOAuthToken(this._providerToString(provider), credentials,
                                     this._handleFirebaseCb(res, rej), options);
    });

    return p;
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

  private _handleFirebaseCb(res: Function, rej: Function): (err: any, auth?: FirebaseAuthData) => void {
    return (err, auth?) => {
      if (err) {
        return rej (err);
      } else {
        return res (this._authDataToAuthState(auth));
      }
    };
  }

  private _authDataToAuthState(authData: FirebaseAuthDataAllProviders): FirebaseAuthState {
    let {auth, uid, provider, github, twitter, facebook, google, password, anonymous} = authData;
    let authState: FirebaseAuthState = {auth, uid, provider: null};
    switch (provider) {
      case 'github':
        authState.github = github;
        authState.provider = AuthProviders.Github;
        break;
      case 'twitter':
        authState.twitter = twitter;
        authState.provider = AuthProviders.Twitter;
        break;
      case 'facebook':
        authState.facebook = facebook;
        authState.provider = AuthProviders.Facebook;
        break;
      case 'google':
        authState.google = google;
        authState.provider = AuthProviders.Google;
        break;
      case 'password':
        authState.password = password;
        authState.provider = AuthProviders.Password;
        break;
      case 'anonymous':
        authState.anonymous = anonymous;
        authState.provider = AuthProviders.Anonymous;
        break;
      case 'custom':
        authState.provider = AuthProviders.Custom;
        break;
      default:
        throw new Error(`Unsupported firebase auth provider ${provider}`);
    }

    return authState;
  }
}

export interface AuthConfiguration {
  method?: AuthMethods;
  provider?: AuthProviders;
  remember?: string;
  scope?: string[];
}

export interface OAuth2Credentials {
  token: string;
}

export interface OAuth1Credentials {
  user_id: string;
  oauth_token: string;
  oauth_token_secret: string;
}

export type OAuthCredentials = OAuth1Credentials | OAuth2Credentials;

export type AuthCredentials = FirebaseCredentials | OAuthCredentials;

export interface FirebaseAuthState {
  uid: string;
  provider: AuthProviders;
	auth: Object;
  expires?: number;
  github?: any;
	google?: any;
  twitter?: any;
  facebook?: any;
  password?: any;
  anonymous?: any;
}

// Firebase only provides typings for google
interface FirebaseAuthDataAllProviders extends FirebaseAuthData {
  github?: any;
  twitter?: any;
  google?: any;
  facebook?: any;
  password?: any;
  anonymous?: any;
}
