import {
  expect,
  ddescribe,
  describe,
  it,
  iit,
  beforeEach
} from '@angular/core/testing';

import {
  authDataToAuthState,
  AuthProviders,
  FirebaseAuthState,
  CommonOAuthCredential,
  GoogleCredential,
  TwitterCredential
} from './auth_backend';

const baseFBUser = {
  uid: '12345',
  providerId: '',
  providerData: [{}]
};

const baseAuthState: FirebaseAuthState = {
  uid: baseFBUser.uid,
  provider: AuthProviders.Anonymous,
  auth: <firebase.User>baseFBUser
};

const baseGithubCredential: CommonOAuthCredential = {
  accessToken: 'GH_ACCESS_TOKEN',
  provider: 'github.com'
};

const baseFacebookCredential: CommonOAuthCredential = {
  accessToken: 'FB_ACCESS_TOKEN',
  provider: 'facebook.com'
};

const baseGoogleCredential: GoogleCredential = {
  idToken: 'GOOGLE_ID_TOKEN',
  provider: 'google.com'
};

const baseTwitterCredential: TwitterCredential = {
  accessToken: 'TWITTER_ACCESS_TOKEN',
  provider: 'twitter.com',
  secret: 'TWITTER_SECRET'
};

describe('auth_backend', () => {
  describe('authDataToAuthState', () => {
    it('Github: should return a FirebaseAuthState object with full provider data', () => {
      let githubUser = Object.assign({}, baseFBUser, {
        providerData: [{providerId: 'github.com'}]
      });
      let expectedAuthState = Object.assign({}, baseAuthState, {
        github: baseGithubCredential,
        auth: githubUser
      });

      let actualAuthState = authDataToAuthState(githubUser, baseGithubCredential);
      expect(actualAuthState.github.accessToken).toEqual(baseGithubCredential.accessToken);
    });
  });

  it('Google: should return a FirebaseAuthState object with full provider data', () => {
    let googleUser = Object.assign({}, baseFBUser, {
      providerData: [{providerId: 'google.com'}]
    });
    let expectedAuthState = Object.assign({}, baseAuthState, {
      google: baseGoogleCredential,
      auth: googleUser
    });

    let actualAuthState = authDataToAuthState(googleUser, baseGoogleCredential);
    expect(actualAuthState.google.idToken).toEqual(baseGoogleCredential.idToken);
  });

  it('Twitter: should return a FirebaseAuthState object with full provider data', () => {
    let twitterUser = Object.assign({}, baseFBUser, {
      providerData: [{providerId: 'twitter.com'}]
    });
    let expectedAuthState = Object.assign({}, baseAuthState, {
      twitter: baseTwitterCredential,
      auth: twitterUser
    });

    let actualAuthState = authDataToAuthState(twitterUser, baseTwitterCredential);
    expect(actualAuthState.twitter.secret).toEqual(baseTwitterCredential.secret);
  });

  it('Facebook: should return a FirebaseAuthState object with full provider data', () => {
    let facebookUser = Object.assign({}, baseFBUser, {
      providerData: [{providerId: 'facebook.com'}]
    });
    let expectedAuthState = Object.assign({}, baseAuthState, {
      facebook: baseFacebookCredential,
      auth: facebookUser
    });

    let actualAuthState = authDataToAuthState(facebookUser, baseFacebookCredential);
    expect(actualAuthState.facebook.accessToken).toEqual(baseFacebookCredential.accessToken);
  });
});
