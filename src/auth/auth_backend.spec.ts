import {
  authDataToAuthState,
  AuthProviders,
  FirebaseAuthState
} from './auth_backend';

const baseFBUser = {
  uid: '12345',
  providerId: '',
  providerData: [{}]
};

const anonymouseFirebaseUser = <firebase.User> {
  uid: 'fCjhqFLSmLRI1YOfFwy7MDmjBpC9',
  isAnonymous: true,
  providerData: []
};

const baseAuthState: FirebaseAuthState = {
  uid: baseFBUser.uid,
  provider: AuthProviders.Anonymous,
  auth: <firebase.User>baseFBUser
};

const baseGithubCredential = {
  providerId: 'github.com',
  displayName: 'GithubAlice'
} as firebase.UserInfo;

const baseFacebookCredential = {
  displayName: 'FacebookFranny',
  providerId: 'facebook.com'
} as firebase.UserInfo;

const baseGoogleCredential = {
  displayName: 'GoogleGerry',
  providerId: 'google.com'
} as firebase.UserInfo;

const baseTwitterCredential = {
  displayName: 'TwitterTiffany',
  providerId: 'twitter.com',
} as firebase.UserInfo;

describe('auth_backend', () => {
  describe('authDataToAuthState', () => {
    it('Github: should return a FirebaseAuthState object with full provider data', () => {
      let githubUser = Object.assign({}, baseFBUser, {
        providerData: [{providerId: 'github.com'}]
      }) as firebase.User;
      let expectedAuthState = Object.assign({}, baseAuthState, {
        github: baseGithubCredential,
        auth: githubUser
      });

      let actualAuthState = authDataToAuthState(githubUser, baseGithubCredential);
      expect(actualAuthState.github.displayName).toEqual(baseGithubCredential.displayName);
    });
  });

  it('Google: should return a FirebaseAuthState object with full provider data', () => {
    let googleUser = Object.assign({}, baseFBUser, {
      providerData: [{providerId: 'google.com'}]
    }) as firebase.User;
    let expectedAuthState = Object.assign({}, baseAuthState, {
      google: baseGoogleCredential,
      auth: googleUser
    });

    let actualAuthState = authDataToAuthState(googleUser, baseGoogleCredential);
    expect(actualAuthState.google.displayName).toEqual(baseGoogleCredential.displayName);
  });

  it('Twitter: should return a FirebaseAuthState object with full provider data', () => {
    let twitterUser = Object.assign({}, baseFBUser, {
      providerData: [{providerId: 'twitter.com'}]
    }) as firebase.User;
    let expectedAuthState = Object.assign({}, baseAuthState, {
      twitter: baseTwitterCredential,
      auth: twitterUser
    });

    let actualAuthState = authDataToAuthState(twitterUser, baseTwitterCredential);
    expect(actualAuthState.twitter.displayName).toEqual(baseTwitterCredential.displayName);
  });

  it('Facebook: should return a FirebaseAuthState object with full provider data', () => {
    let facebookUser = Object.assign({}, baseFBUser, {
      providerData: [{providerId: 'facebook.com'}]
    }) as firebase.User;
    let expectedAuthState = Object.assign({}, baseAuthState, {
      facebook: baseFacebookCredential,
      auth: facebookUser
    });

    let actualAuthState = authDataToAuthState(facebookUser, baseFacebookCredential);
    expect(actualAuthState.facebook.displayName).toEqual(baseFacebookCredential.displayName);
  });


  it('Anonymous: should return a FirebaseAuthState object', () => {
    let anonymousFirebaseUser = Object.assign({}, baseFBUser, {
      providerData: [],
      isAnonymous: true
    }) as firebase.User;
    let expectedAuthState = Object.assign({}, baseAuthState, {
      facebook: baseFacebookCredential,
      auth: anonymousFirebaseUser
    });

    let actualAuthState = authDataToAuthState(anonymousFirebaseUser);
    expect(actualAuthState.anonymous).toEqual(true);
  });
});
