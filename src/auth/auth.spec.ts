import { User } from 'firebase/app';
import { Observable, Subject } from 'rxjs'
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FIREBASE_OPTIONS, AngularFireModule, FIREBASE_APP_NAME } from '@angular/fire';
import { AngularFireAuth, AngularFireAuthModule } from './public_api';
import { COMMON_CONFIG } from '../test-config';
import { take, skip } from 'rxjs/operators';
import 'firebase/auth';
import { rando } from '../firestore/utils.spec';

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
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireAuthModule
      ]
    });
    inject([FirebaseApp, AngularFireAuth], (app_: FirebaseApp, _auth: AngularFireAuth) => {
      app = app_;
      afAuth = _auth;
    })();

    mockAuthState = new Subject<User>();
    //@ts-ignore
    spyOn(afAuth, 'authState').and.returnValue(mockAuthState);
    //@ts-ignore
    spyOn(afAuth, 'idToken').and.returnValue(mockAuthState);
    (<any>afAuth).authState = mockAuthState as Observable<User>;
    (<any>afAuth).idToken = mockAuthState as Observable<User>;
  });

  afterEach(() => {
    app.delete();
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

  it('should exist', () => {
    expect(afAuth instanceof AngularFireAuth).toBe(true);
  });

  it('should have an initialized Firebase app', () => {
    expect(afAuth.app).toBeDefined();
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
        expect(<any>user).toEqual(firebaseUser);
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
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireAuthModule
      ],
      providers: [
        { provide: FIREBASE_APP_NAME, useValue: FIREBASE_APP_NAME_TOO },
        { provide: FIREBASE_OPTIONS, useValue: COMMON_CONFIG }
      ]
    });
    inject([FirebaseApp, AngularFireAuth], (app_: FirebaseApp, _afAuth: AngularFireAuth) => {
      app = app_;
      afAuth = _afAuth;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  describe('<constructor>', () => {

    it('should be an AngularFireAuth type', () => {
      expect(afAuth instanceof AngularFireAuth).toEqual(true);
    });

    it('should have an initialized Firebase app', () => {
      expect(afAuth.app).toBeDefined();
    });

    it('should have an initialized Firebase app instance member', async () => {
      const app = await afAuth.app;
      expect(app.name).toEqual(FIREBASE_APP_NAME_TOO);
    });
  });

});
