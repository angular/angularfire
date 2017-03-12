import * as firebase from 'firebase/app';
import { auth, initializeApp } from 'firebase';
import { ReflectiveInjector, Provider } from '@angular/core';
import { Observable } from 'rxjs/Observable'
import { Observer } from 'rxjs/Observer';
import { TestBed, inject } from '@angular/core/testing';
import { _do } from 'rxjs/operator/do';
import { take } from 'rxjs/operator/take';
import 'rxjs/operator/take';
import 'rxjs/operator/do';
import { FIREBASE_PROVIDERS, FirebaseApp, FirebaseAppConfig, FirebaseAuthState, FirebaseAppConfigToken, AngularFireAuth, AuthMethods, firebaseAuthConfig, AuthProviders, WindowLocation, AngularFireModule } from '../angularfire2';
import { COMMON_CONFIG, ANON_AUTH_CONFIG } from '../test-config';
import { AuthBackend } from './auth_backend';
import { FirebaseSdkAuthBackend } from './firebase_sdk_auth_backend';

// Set providers from firebase so no firebase.auth.GoogleProvider() necessary
const {
  GoogleAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider
} = auth;

const authMethods = [
  'getRedirectResult',
  'signInWithCustomToken',
  'signInAnonymously',
  'signInWithEmailAndPassword',
  'signInWithPopup',
  'signInWithRedirect',
  'signInWithCredential',
  'signOut',
  'onAuthStateChanged',
  'createUserWithEmailAndPassword',
  'changeEmail',
  'removeUser',
  'resetPassword'
];

const firebaseUser = <firebase.User> {
  uid: '12345',
  providerData: [{
    'displayName': 'jeffbcross',
    // TODO verify this property name
    providerId: 'github.com'
  }]
};

const anonymouseFirebaseUser = <firebase.User> {
  uid: '12345',
  isAnonymous: true,
  providerData: []
};

const githubCredential = {
  credential: {
    provider: 'github.com'
  },
  user: firebaseUser
};

const googleCredential = {
  credential: {},
  user: firebaseUser
};

const AngularFireAuthState = {
  provider: 0,
  auth: firebaseUser,
  uid: '12345',
  github: {
    displayName: 'FirebaseUser',
    providerId: 'github.com'
  } as firebase.UserInfo
} as FirebaseAuthState;

describe('Zones', () => {
  it('should call operators and subscriber in the same zone as when service was initialized', (done) => {
    // Initialize the app outside of the zone, to mimick real life behavior.
    var app = initializeApp(COMMON_CONFIG, 'zoneapp');

    let ngZone = Zone.current.fork({
      name: 'ngZone'
    });
    ngZone.run(() => {
      var afAuth = new AngularFireAuth(new FirebaseSdkAuthBackend(app), window.location);
      var authObs = afAuth.take(1);
      
      _do.call(authObs, _ => {
          expect(Zone.current.name).toBe('ngZone');
        })
        .subscribe(() => {
          expect(Zone.current.name).toBe('ngZone');
          done()
        }, done.fail);
    });
  });
});

describe('FirebaseAuth', () => {
  let app: firebase.app.App;
  let authData: any;
  let authCb: any;
  let backend: AuthBackend;
  let afAuth: AngularFireAuth;
  let authSpy: jasmine.Spy;
  let fbAuthObserver: Observer<firebase.User>;
  let windowLocation: any;

  beforeEach(() => {
    windowLocation = {
      hash: '',
      search: '',
      pathname:'/',
      port: '',
      hostname:'localhost',
      host:'localhost',
      protocol:'https:',
      origin:'localhost',
      href:'https://localhost/'
    };

    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(COMMON_CONFIG, ANON_AUTH_CONFIG)],
      providers: [
        {
          provide: FirebaseApp,
          useFactory: (config: FirebaseAppConfig) => {
            var app = initializeApp(config);
            (<any>app).auth = () => authSpy;
            return app;
          },
          deps: [FirebaseAppConfigToken]
        },
        {
          provide: WindowLocation,
          useValue: windowLocation
        }
      ]
    });

    authSpy = jasmine.createSpyObj('auth', authMethods);
    authSpy['createUserWithEmailAndPassword'].and.returnValue(Promise.resolve(firebaseUser));
    authSpy['signInWithPopup'].and.returnValue(Promise.resolve(googleCredential));
    authSpy['signInWithRedirect'].and.returnValue(Promise.resolve(AngularFireAuthState));
    authSpy['signInWithCredential'].and.returnValue(Promise.resolve(firebaseUser));
    authSpy['signInAnonymously'].and.returnValue(Promise.resolve(anonymouseFirebaseUser));
    authSpy['signInWithCustomToken'].and.returnValue(Promise.resolve(firebaseUser));
    authSpy['signInWithEmailAndPassword'].and.returnValue(Promise.resolve(firebaseUser));
    authSpy['onAuthStateChanged']
      .and.callFake((obs: Observer<firebase.User>) => {
        fbAuthObserver = obs;
      });
    authSpy['getRedirectResult'].and.returnValue(Promise.resolve(null));

    inject([FirebaseApp, AngularFireAuth], (_app: firebase.app.App, _afAuth: AngularFireAuth) => {
      app = _app;
      afAuth = _afAuth;
      authData = null;
      authCb = null;
      backend = new FirebaseSdkAuthBackend(app);
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });


  it('should be an observable', () => {
    expect(afAuth instanceof Observable).toBe(true);
  });


  it('should emit auth updates', (done: any) => {
    let count = 0;
    fbAuthObserver.next(null);

    // Check that the first value is null
    afAuth
      .take(1)
      .do((authData) => {
        expect(authData).toBe(null);
        setTimeout(() => fbAuthObserver.next(firebaseUser));
      })
      .subscribe();

    // Check the 2nd value emitted from the observable
    afAuth
      .skip(1)
      .take(1)
      .do((authData) => {
        expect(authData.auth).toEqual(AngularFireAuthState.auth);
      })
      // Subsribes on next instead of complete to ensure a value is emitted
      .subscribe(null, done.fail, done);
  }, 10);

  describe('AuthState', () => {
    it('should asynchronously load firebase auth data', (done) => {
      fbAuthObserver.next(firebaseUser);
      afAuth
        .take(1)
        .subscribe((data) => {
          expect(data.auth).toEqual(AngularFireAuthState.auth);
        }, done.fail, done);
    });

    it('should be null if user is not authed', (done) => {
      fbAuthObserver.next(null);
      afAuth
        .take(1)
        .subscribe(authData => {
          expect(authData).toBe(null);
        }, done.fail, done);
    });
  });


  describe('firebaseAuthConfig', () => {
    it('should return a provider', () => {
      expect(firebaseAuthConfig({ method: AuthMethods.Password }).provide).toBeTruthy()
    });

    it('should use config in login', () => {
      let config = {
        method: AuthMethods.Anonymous
      };
      afAuth = new AngularFireAuth(backend, windowLocation, config);
      afAuth.login();
      expect(app.auth().signInAnonymously).toHaveBeenCalled();
    });

    it('should be overridden by login\'s arguments', () => {
      let config = {
        method: AuthMethods.Anonymous
      };
      afAuth = new AngularFireAuth(backend, windowLocation, config);
      afAuth.login({
        method: AuthMethods.Popup,
        provider: AuthProviders.Google
      });
      var spyArgs = (<jasmine.Spy>app.auth().signInWithPopup).calls.argsFor(0)[0];
      var googleProvider = new GoogleAuthProvider();
      expect(app.auth().signInWithPopup).toHaveBeenCalledWith(googleProvider);
    });

    it('should be merged with login\'s arguments', () => {
      let config = {
        method: AuthMethods.Popup,
        provider: AuthProviders.Google,
        scope: ['email']
      };
      afAuth = new AngularFireAuth(backend, windowLocation, config);
      afAuth.login({
        provider: AuthProviders.Github
      });
      var githubProvider = new GithubAuthProvider();
      githubProvider.addScope('email');
      expect(app.auth().signInWithPopup).toHaveBeenCalledWith(githubProvider);
    });
  });

  describe('createUser', () => {
    let credentials = { email: 'noreply@github.com', password: 'password' };

    it('should call createUser on the app reference', () => {
      afAuth.createUser(credentials);
      expect(app.auth().createUserWithEmailAndPassword)
        .toHaveBeenCalledWith(credentials.email, credentials.password);
    });
  });

  describe('login', () => {
    it('should reject if password is used without credentials', (done: any) => {
      let config = {
        method: AuthMethods.Password
      };
      let afAuth = new AngularFireAuth(backend, windowLocation, config);
      afAuth.login()
        .then(done.fail, done);
    });

    it('should reject if custom token is used without credentials', (done: any) => {
      let config = {
        method: AuthMethods.CustomToken
      };
      let afAuth = new AngularFireAuth(backend, windowLocation, config);
      afAuth.login()
        .then(done.fail, done);
    });

    it('should reject if oauth token is used without credentials', (done: any) => {
      let config = {
        method: AuthMethods.OAuthToken
      };
      let afAuth = new AngularFireAuth(backend, windowLocation, config);
      afAuth.login()
        .then(done.fail, done);
    });

    it('should reject if popup is used without a provider', (done: any) => {
      let config = {
        method: AuthMethods.Popup
      };
      let afAuth = new AngularFireAuth(backend, windowLocation, config);
      afAuth.login()
        .then(done.fail, done);
    });

    it('should reject if redirect is used without a provider', (done: any) => {
      let config = {
        method: AuthMethods.Redirect
      };
      let afAuth = new AngularFireAuth(backend, windowLocation, config);
      afAuth.login()
        .then(done.fail, done);
    });

    describe('authWithCustomToken', () => {
      let options = {
        method: AuthMethods.CustomToken
      };
      let credentials = 'myToken';

      it('passes custom token to underlying method', () => {
        afAuth.login(credentials, options);
        expect(app.auth().signInWithCustomToken)
          .toHaveBeenCalledWith('myToken');
      });

      it('will reject the promise if authentication fails', (done: any) => {
        authSpy['signInWithCustomToken'].and.returnValue(Promise.reject('error'));
        afAuth.login(credentials, options)
          .then(done.fail, done);
      });

      it('will resolve the promise upon authentication', (done: any) => {
        afAuth.login(credentials, options)
          .then(result => {
            expect(result.auth).toEqual(AngularFireAuthState.auth);
          })
          .then(done, done.fail);
      });
    });

    describe('authAnonymously', () => {
      let options = {
        method: AuthMethods.Anonymous
      };

      it('passes options object to underlying method', () => {
        afAuth.login(options);
        expect(app.auth().signInAnonymously).toHaveBeenCalled();
      });

      it('will reject the promise if authentication fails', (done: any) => {
        authSpy['signInAnonymously'].and.returnValue(Promise.reject('myError'));
        afAuth.login(options)
          .then(done.fail, done);
      });

      it('will resolve the promise upon authentication', (done: any) => {
        afAuth.login(options)
          .then(result => {
            expect(result.auth).toEqual(anonymouseFirebaseUser);
          })
          .then(done, done.fail);

      });
    });

    describe('authWithPassword', () => {
      let options = { remember: 'default', method: AuthMethods.Password };
      let credentials = { email: 'myname', password: 'password' };

      it('should login with password credentials', () => {
        let config = {
          method: AuthMethods.Password,
          provider: AuthProviders.Password
        };
        const credentials = {
          email: 'david@fire.com',
          password: 'supersecretpassword'
        };
        let afAuth = new AngularFireAuth(backend, windowLocation, config);
        afAuth.login(credentials);
        expect(app.auth().signInWithEmailAndPassword).toHaveBeenCalledWith(credentials.email, credentials.password);
      });

      it('passes options and credentials object to underlying method', () => {
        afAuth.login(credentials, options);
        expect(app.auth().signInWithEmailAndPassword).toHaveBeenCalledWith(
          credentials.email,
          credentials.password);
      });

      it('will revoke the promise if authentication fails', (done: any) => {
        authSpy['signInWithEmailAndPassword'].and.returnValue(Promise.reject('myError'));
        afAuth.login(credentials, options)
          .then(done.fail, done);
      });

      it('will resolve the promise upon authentication', (done: any) => {
        afAuth.login(credentials, options)
          .then(result => {
            expect(result.auth).toEqual(AngularFireAuthState.auth);
          })
          .then(done, done.fail);
      });
    });

    describe('authWithOAuthPopup', function() {
      let options = {
        method: AuthMethods.Popup,
        provider: AuthProviders.Github
      };

      beforeEach(() => {
        authSpy['signInWithPopup'].and.returnValue(Promise.resolve(githubCredential));
      })

      it('passes provider and options object to underlying method', () => {
        let customOptions = Object.assign({}, options);
        customOptions['scope'] = ['email'];
        afAuth.login(customOptions);
        let githubProvider = new GithubAuthProvider();
        githubProvider.addScope('email');
        expect(app.auth().signInWithPopup).toHaveBeenCalledWith(githubProvider);
      });

      it('will reject the promise if authentication fails', (done: any) => {
        authSpy['signInWithPopup'].and.returnValue(Promise.reject('myError'));
        afAuth.login(options)
          .then(done.fail, done);
      });

      it('will resolve the promise upon authentication', (done: any) => {
        afAuth.login(options)
          .then(result => {
            expect(result.auth).toEqual(AngularFireAuthState.auth);
          })
          .then(done, done.fail);
      });

      it('should include credentials in onAuth payload after logging in', (done) => {
        afAuth
          .take(1)
          .do((user: FirebaseAuthState) => {
            expect(user.github).toBe(githubCredential.credential);
          })
          .subscribe(done, done.fail);

        afAuth.login(options)
          .then(() => {
            // Calling with undefined `github` value to mimick actual Firebase value
            fbAuthObserver.next(firebaseUser);
          });
      }, 10);


      xit('should not call getRedirectResult() if location.protocol is not http or https', (done) => {
        windowLocation.protocol = 'file:';
        afAuth
          .take(1)
          .do(() => {
            expect(authSpy['getRedirectResult']).not.toHaveBeenCalled();
          })
          .subscribe(done, done.fail);
        fbAuthObserver.next(firebaseUser);
      });
    });

    describe('authWithOAuthRedirect', () => {
      const options = {
        method: AuthMethods.Redirect,
        provider: AuthProviders.Github
      };

      it('passes provider and options object to underlying method', () => {
        let customOptions = Object.assign({}, options);
        customOptions['scope'] = ['email'];
        afAuth.login(customOptions);
        let githubProvider = new GithubAuthProvider();
        expect(app.auth().signInWithRedirect).toHaveBeenCalledWith(githubProvider);
      });

      it('will reject the promise if authentication fails', (done: any) => {
        authSpy['signInWithRedirect'].and.returnValue(Promise.reject('myError'));
        afAuth.login(options)
          .then(done.fail, done);
      });

      it('will resolve the promise upon authentication', (done: any) => {
        afAuth.login(options)
          .then(result => {
            expect(result).toEqual(AngularFireAuthState);
          })
          .then(done, done.fail);
      });

      it('should include credentials in onAuth payload after logging in', (done) => {
        authSpy['getRedirectResult'].and.returnValue(Promise.resolve(githubCredential));
        afAuth
          .do((user: FirebaseAuthState) => {
            expect(user.github).toBe(githubCredential.credential);
          })
          .take(2)
          .subscribe(null, done.fail, done);

        afAuth.login(options)
          .then(() => {
            // Calling with undefined `github` value to mimick actual Firebase value
            fbAuthObserver.next(firebaseUser);
          })
          .then(() => {
            // Call it twice to make sure it caches the result
            fbAuthObserver.next(firebaseUser);
          });
      }, 10);
    });

    describe('authWithOAuthToken', () => {
      const options = {
        method: AuthMethods.OAuthToken,
        provider: AuthProviders.Github,
        scope: ['email']
      };
      const token = 'GITHUB_TOKEN';
      const credentials = (<any> GithubAuthProvider).credential(token);

      it('passes provider, token, and options object to underlying method', () => {
        afAuth.login(credentials, options);
        expect(app.auth().signInWithCredential).toHaveBeenCalledWith(credentials);
      });

      it('passes provider, OAuth credentials, and options object to underlying method', () => {
        let customOptions = Object.assign({}, options);
        customOptions.provider = AuthProviders.Twitter;
        let credentials = (<any> TwitterAuthProvider).credential('<ACCESS-TOKEN>', '<ACCESS-TOKEN-SECRET>');
        afAuth.login(credentials, customOptions);
        expect(app.auth().signInWithCredential).toHaveBeenCalledWith(credentials);
      });

      it('will reject the promise if authentication fails', (done: any) => {
        authSpy['signInWithCredential'].and.returnValue(Promise.reject('myError'));
        afAuth.login(credentials, options)
          .then(done.fail, done);
      });

      it('will resolve the promise upon authentication', (done: any) => {
        afAuth.login(credentials, options)
          .then(result => {
            expect(result.auth).toEqual(AngularFireAuthState.auth);
          })
          .then(done, done.fail);
      });
    });


    describe('unauth()', () => {
      it('will call unauth() on the backing ref', () => {
        afAuth.logout();
        expect(app.auth().signOut).toHaveBeenCalled();
      });
    });


    describe('getAuth()', () => {
      it('should return null when no user is logged in', () => {
        authSpy['currentUser'] = null;
        expect(afAuth.getAuth()).toBe(null);
      });


      it('should return authState if user is logged in', () => {
        authSpy['currentUser'] = firebaseUser;
        expect(afAuth.getAuth().uid).toEqual(AngularFireAuthState.uid);
      })
    });
  });
});

