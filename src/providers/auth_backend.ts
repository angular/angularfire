import { Observable } from 'rxjs/Observable';

export abstract class AuthBackend {
  abstract authWithCustomToken(token: string): Promise<FirebaseAuthState>;
  abstract authAnonymously(options?: any): Promise<FirebaseAuthState>;
  abstract authWithPassword(credentials: EmailPasswordCredentials): Promise<FirebaseAuthState>;
  abstract authWithOAuthPopup(provider: AuthProviders, options?: any): Promise<firebase.auth.UserCredential>;
  abstract authWithOAuthRedirect(provider: AuthProviders, options?: any): Promise<void>;
  abstract authWithOAuthToken(credentialsObj: firebase.auth.AuthCredential, options?: any)
    : Promise<FirebaseAuthState>;
  abstract onAuth(): Observable<FirebaseAuthState>;
  abstract getAuth(): FirebaseAuthState;
  abstract unauth(): void;
  abstract createUser(credentials: EmailPasswordCredentials): Promise<FirebaseAuthState>;
  abstract getRedirectResult(): Observable<firebase.auth.UserCredential>;
}

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

export interface AuthConfiguration {
  method?: AuthMethods;
  provider?: AuthProviders;
  remember?: string;
  scope?: string[];
}

export interface FirebaseAuthState {
  uid: string;
  provider: AuthProviders;
  auth: firebase.User;
  expires?: number;
  github?: CommonOAuthCredential;
  google?: GoogleCredential;
  twitter?: TwitterCredential;
  facebook?: CommonOAuthCredential;
  anonymous?: boolean;
}

export interface CommonOAuthCredential {
  accessToken: string;
  provider: 'github.com' | 'google.com' | 'twitter.com' | 'facebook.com';
}

export interface GoogleCredential {
  idToken: string;
  provider: 'google.com';
}

export interface TwitterCredential extends CommonOAuthCredential {
  secret: string;
}

export type OAuthCredential = CommonOAuthCredential | GoogleCredential | TwitterCredential;

export function authDataToAuthState(authData: firebase.User, providerData?: OAuthCredential): FirebaseAuthState {
  if (!authData) return null;
  let providerId;
  let { uid } = authData;
  let authState: FirebaseAuthState = { auth: authData, uid, provider: null };
  if (authData.isAnonymous) {
    providerId = 'anonymous';
    authState.provider = AuthProviders.Anonymous;
    authState.anonymous = true;
    return authState;
  } else {
    // when we do custom authentication there is no
    // providerData that is returned
    if (authData.providerData && authData.providerData.length > 0) {
      providerId = authData.providerData[0].providerId;
    } else {
      providerId = 'custom';
    }
  }

  switch (providerId) {
    case 'github.com':
      authState.github = <CommonOAuthCredential>providerData;
      authState.provider = AuthProviders.Github;
      break;
    case 'twitter.com':
      authState.twitter = <TwitterCredential>providerData;
      authState.provider = AuthProviders.Twitter;
      break;
    case 'facebook.com':
      authState.facebook = <CommonOAuthCredential>providerData;
      authState.provider = AuthProviders.Facebook;
      break;
    case 'google.com':
      authState.google = <GoogleCredential>providerData;
      authState.provider = AuthProviders.Google;
      break;
    case 'password':
      authState.provider = AuthProviders.Password;
      break;
    case 'custom':
      authState.provider = AuthProviders.Custom;
      break;
    default:
      throw new Error(`Unsupported firebase auth provider ${providerId}`);
  }

  return authState;
}

export function stripProviderId(providerId: string): string {
  let providerStripped = /(.*)\.com$/.exec(providerId);
  if (providerStripped && providerStripped.length === 2) {
    return providerStripped[1];
  }
  return null;
}

export interface EmailPasswordCredentials {
  email: string;
  password: string;
}
