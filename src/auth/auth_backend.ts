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
  scope?: string[];
}

export interface FirebaseAuthState {
  uid: string;
  provider: AuthProviders;
  auth: firebase.User;
  expires?: number;
  github?: firebase.UserInfo;
  google?: firebase.UserInfo;
  twitter?: firebase.UserInfo;
  facebook?: firebase.UserInfo;
  anonymous?: boolean;
}

export function authDataToAuthState(authData: firebase.User, providerData?: firebase.UserInfo): FirebaseAuthState {
  if (!authData) return null;
  let providerId;
  let { uid } = authData;
  let authState: FirebaseAuthState = { auth: authData, uid, provider: null };
  if (authData.isAnonymous) {
    providerId = 'anonymous';
    authState.provider = AuthProviders.Anonymous;
    authState.anonymous = true;
    return authState;
  } else if (authData.providerData[0] === undefined || authData.providerData[0] === null) {
    // There is no provider data, user is likely custom
    providerId = 'custom';
    authState.provider = AuthProviders.Custom;
    return authState;
  } else {
    providerId = authData.providerData[0].providerId;
  }

  switch (providerId) {
    case 'github.com':
      authState.github = providerData;
      authState.provider = AuthProviders.Github;
      break;
    case 'twitter.com':
      authState.twitter = providerData;
      authState.provider = AuthProviders.Twitter;
      break;
    case 'facebook.com':
      authState.facebook = providerData;
      authState.provider = AuthProviders.Facebook;
      break;
    case 'google.com':
      authState.google = providerData;
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

export function stripProviderId (providerId: string): string {
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
