import { FirebaseApp } from '@firebase/app-types';
import { User } from '@firebase/auth-types';
import { ReflectiveInjector, Provider } from '@angular/core';
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { Observer } from 'rxjs/Observer';
import { TestBed, inject } from '@angular/core/testing';
import { _do } from 'rxjs/operator/do';
import { take } from 'rxjs/operator/take';
import { skip } from 'rxjs/operator/skip';
import { FirebaseAppConfig, AngularFireModule, FirebaseAppName } from 'angularfire2';
import { AngularFireAuth, AngularFireAuthModule } from 'angularfire2/auth';
import { COMMON_CONFIG } from './test-config';

function authTake(auth: Observable<any>, count: number): Observable<any> {
  return take.call(auth, 1);
}

function authSkip(auth: Observable<any>, count: number): Observable<any> {
  return skip.call(auth, 1);
}

const firebaseUser = <User> {
  uid: '12345',
  providerData: [{ displayName: 'jeffbcrossyface' }]
};

describe('AngularFireAuth', () => {
  let app: FirebaseApp;
  let afAuth: AngularFireAuth;
  let authSpy: jasmine.Spy;
  let mockAuthState: Subject<User>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireAuthModule
      ]
    });
    inject([FirebaseApp, AngularFireAuth], (app_: FirebaseApp, _auth: AngularFireAuth) => {
      app = app_;
      afAuth = _auth;
    })();

    mockAuthState = new Subject<User>();
    spyOn(afAuth, 'authState').and.returnValue(mockAuthState);
    spyOn(afAuth, 'idToken').and.returnValue(mockAuthState);
    afAuth.authState = mockAuthState as Observable<User>;
    afAuth.idToken = mockAuthState as Observable<User>;
  });

  afterEach(done => {
    afAuth.auth.app.delete().then(done, done.fail);
  });

  describe('Zones', () => {
    it('should call operators and subscriber in the same zone as when service was initialized', (done) => {
      // Initialize the app outside of the zone, to mimick real life behavior.
      let ngZone = Zone.current.fork({
        name: 'ngZone'
      });
      ngZone.run(() => {
        const subs = [
          afAuth.authState.subscribe(user => {
            expect(Zone.current.name).toBe('ngZone');
            done();
          }, done.fail),
          afAuth.authState.subscribe(user => {
            expect(Zone.current.name).toBe('ngZone');
            done();
          }, done.fail)
        ];
        mockAuthState.next(firebaseUser);
        subs.forEach(s => s.unsubscribe());
      });
    });
  });

  it('should be exist', () => {
    expect(afAuth instanceof AngularFireAuth).toBe(true);
  });

  it('should have the Firebase Auth instance', () => {
    expect(afAuth.auth).toBeDefined();
  });

  it('should have an initialized Firebase app', () => {
    expect(afAuth.auth.app).toBeDefined();
    expect(afAuth.auth.app).toEqual(app);
  });

  it('should emit auth updates through authState', (done: any) => {
    let count = 0;

    // Check that the first value is null and second is the auth user
    const subs = afAuth.authState.subscribe(user => {
      if (count === 0) {
        expect(user).toBe(null!);
        count = count + 1;
        mockAuthState.next(firebaseUser);
      } else {
        expect(user).toEqual(firebaseUser);
        subs.unsubscribe();
        done();
      }
    }, done, done.fail);
    mockAuthState.next(null!);
  });

  it('should emit auth updates through idToken', (done: any) => {
    let count = 0;

    // Check that the first value is null and second is the auth user
    const subs = afAuth.idToken.subscribe(user => {
      if (count === 0) {
        expect(user).toBe(null!);
        count = count + 1;
        mockAuthState.next(firebaseUser);
      } else {
        expect(user).toEqual(firebaseUser);
        subs.unsubscribe();
        done();
      }
    }, done, done.fail);
    mockAuthState.next(null!);
  });

});

const FIREBASE_APP_NAME_TOO = (Math.random() + 1).toString(36).substring(7);

describe('AngularFireAuth with different app', () => {
  let app: FirebaseApp;
  let afAuth: AngularFireAuth;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireAuthModule
      ],
      providers: [
        { provide: FirebaseAppName, useValue: FIREBASE_APP_NAME_TOO },
        { provide: FirebaseAppConfig, useValue:  COMMON_CONFIG }
      ]
    });
    inject([FirebaseApp, AngularFireAuth], (app_: FirebaseApp, _afAuth: AngularFireAuth) => {
      app = app_;
      afAuth = _afAuth;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  describe('<constructor>', () => {

    it('should be an AngularFireAuth type', () => {
      expect(afAuth instanceof AngularFireAuth).toEqual(true);
    });

    it('should have an initialized Firebase app', () => {
      expect(afAuth.auth.app).toBeDefined();
      expect(afAuth.auth.app).toEqual(app);
    });

    it('should have an initialized Firebase app instance member', () => {
      expect(afAuth.auth.app.name).toEqual(FIREBASE_APP_NAME_TOO);
    });
  });

});
