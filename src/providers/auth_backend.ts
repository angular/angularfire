export abstract class AuthBackend {
  abstract authWithCustomToken(token: string, options?: any): Promise<FirebaseAuthState>;
  abstract authAnonymously(options?: any): Promise<FirebaseAuthState>;
  abstract authWithPassword(credentials: FirebaseCredentials, options?: any): Promise<FirebaseAuthState>;
  abstract authWithOAuthPopup(provider: AuthProviders, options?: any): Promise<FirebaseAuthState>;
  abstract authWithOAuthRedirect(provider: AuthProviders, options?: any): Promise<FirebaseAuthState>;
  abstract authWithOAuthToken(provider: AuthProviders, credentialsObj: OAuthCredentials, options?: any)
    : Promise<FirebaseAuthState>;
  abstract onAuth(onComplete: (authData: FirebaseAuthData) => void): void;
  abstract getAuth(): FirebaseAuthData;
  abstract unauth(): void;
  abstract createUser(credentials: FirebaseCredentials): Promise<FirebaseAuthData>;
}

// Firebase only provides typings for google
export interface FirebaseAuthDataAllProviders extends FirebaseAuthData {
  github?: any;
  twitter?: any;
  google?: any;
  facebook?: any;
  password?: any;
  anonymous?: any;
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

export function authDataToAuthState(authData: FirebaseAuthDataAllProviders): FirebaseAuthState {
  let {auth, uid, provider, github, twitter, facebook, google, password, anonymous} = authData;
  let authState: FirebaseAuthState = { auth, uid, provider: null };
  authState.expires = authData.expires;
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

