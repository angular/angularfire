import {expect, describe,it,beforeEach} from 'angular2/testing';
import {Injector, provide} from 'angular2/core';
import {Observable} from 'rxjs/Observable'
import {
  FIREBASE_PROVIDERS,
  FirebaseRef,
  FirebaseUrl,
  FirebaseAuth,
  FirebaseAuthState,
  FirebaseAuthDataGithub,
  AuthProviders
} from '../angularfire2';
import * as Firebase from 'firebase';

describe('FirebaseAuth', () => {
  let injector: Injector = null;
  let ref: Firebase = null;
  let authData: any = null;
  let authCb: any = null;

  const providerMetadata = {
    accessToken: 'accessToken',
    displayName: 'github User',
    username: 'githubUsername',
    id: '12345'
  }
  const authState = {
    provider: 'github',
    uid: 'github:12345',
    github: providerMetadata
  };

  beforeEach (() => {
    authData = null;
    authCb = null;
    injector = Injector.resolveAndCreate([
      provide(FirebaseUrl, {
        useValue: 'ws://localhost.firebaseio.test:5000'
      }),
      FIREBASE_PROVIDERS
    ]);
    ref = injector.get(FirebaseRef);
    spyOn(ref, 'onAuth').and.callFake((fn: (a: any) => void) => {
      authCb = fn;
      authCb(authData);
    });
  });

  it('should be an observable', () => {
    expect(injector.get(FirebaseAuth)).toBeAnInstanceOf(Observable);
  })

  describe('AuthState', () => {
    function updateAuthState(_authData: any): void {
      authData = _authData;
      if (authCb !== null) {
        authCb(authData);
      }
    }

    it('should synchronously load firebase auth data', () => {
      updateAuthState(authState);
      let nextSpy = jasmine.createSpy('nextSpy');
      let auth = injector.get(FirebaseAuth);

      auth.subscribe(nextSpy);
      expect(nextSpy).toHaveBeenCalledWith({
        provider: AuthProviders.Github,
        uid: 'github:12345',
        github: providerMetadata
      });
    });

    it('should be null if user is not authed', () => {
      let auth = injector.get(FirebaseAuth);
      let nextSpy = jasmine.createSpy('nextSpy');

      auth.subscribe(nextSpy);
      expect(nextSpy).toHaveBeenCalledWith(null);
    });

    it('should emit auth updates', (done: () => void) => {
      let auth = injector.get(FirebaseAuth);
      let nextSpy = jasmine.createSpy('nextSpy');

      auth.subscribe(nextSpy);
      expect(nextSpy).toHaveBeenCalledWith(null);
      setTimeout(() => {
        nextSpy.calls.reset();

        updateAuthState(authState);
        expect(nextSpy).toHaveBeenCalledWith({
          provider: AuthProviders.Github,
          uid: 'github:12345',
          github: providerMetadata
        });
        done();
      }, 1);
    });
  });
});

