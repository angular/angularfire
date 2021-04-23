import { Observable, Subject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FirebaseApp, FIREBASE_APPS } from '@angular/fire';
import { AngularFireAuth, AngularFireAuthModule, AUTH_INSTANCES } from '@angular/fire';
import { COMMON_CONFIG } from '../test-config';
import { User } from 'firebase/auth';
import { rando } from '../firestore/utils.spec';
import { deleteApp } from 'firebase/app';

const firebaseUser = {
  uid: '12345',
  providerData: [{ displayName: 'jeffbcrossyface' }]
} as User;

describe('AngularFireAuth', () => {
  let app: FirebaseApp;
  let apps: FirebaseApp[];
  let afAuth: AngularFireAuth;
  let mockAuthState: Subject<User>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireAuthModule
      ]
    });

    app = TestBed.inject(FirebaseApp);
    apps = TestBed.inject(FIREBASE_APPS);
    afAuth = TestBed.inject(AngularFireAuth);

    mockAuthState = new Subject<User>();
    // @ts-ignore
    spyOn(afAuth, 'authState').and.returnValue(mockAuthState);
    // @ts-ignore
    spyOn(afAuth, 'idToken').and.returnValue(mockAuthState);
    (afAuth as any).authState = mockAuthState as Observable<User>;
    (afAuth as any).idToken = mockAuthState as Observable<User>;
  });

  afterEach(() => {
    apps.forEach(app => deleteApp(app));
  });

  describe('Zones', () => {
    it('should call operators and subscriber in the same zone as when service was initialized', (done) => {
      // Initialize the app outside of the zone, to mimick real life behavior.
      const ngZone = Zone.current.fork({
        name: 'ngZone'
      });
      ngZone.run(() => {
        const subs = [
          afAuth.authState.subscribe(() => {
            expect(Zone.current.name).toBe('ngZone');
            done();
          }, done.fail),
          afAuth.authState.subscribe(() => {
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
    expect(afAuth.name).toBeDefined();
  });

  it('should emit auth updates through authState', (done: any) => {
    let count = 0;

    // Check that the first value is null and second is the auth user
    const subs = afAuth.authState.subscribe({
      next: (user => {
        if (count === 0) {
          expect(user).toBe(null);
          count = count + 1;
          mockAuthState.next(firebaseUser);
        } else {
          expect(user).toEqual(firebaseUser);
          subs.unsubscribe();
          done();
        }
      }),
      error: done,
      complete: done.fail
    });
    mockAuthState.next(null);
  });

  it('should emit auth updates through idToken', (done: any) => {
    let count = 0;

    // Check that the first value is null and second is the auth user
    const subs = afAuth.idToken.subscribe({
      next: user => {
        if (count === 0) {
          expect(user).toBe(null);
          count = count + 1;
          mockAuthState.next(firebaseUser);
        } else {
          expect(user as any).toEqual(firebaseUser);
          subs.unsubscribe();
          done();
        }
      },
      error: done,
      complete: done.fail
    });
    mockAuthState.next(null);
  });

});

describe('AngularFireAuth with different app', () => {
  let app: FirebaseApp;
  let apps: FirebaseApp[];
  let authInstances: AngularFireAuth[];
  let firebaseAppName: string;

  beforeEach(() => {
    firebaseAppName = rando();

    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, firebaseAppName ),
        AngularFireAuthModule.initializeAuth({ appName: firebaseAppName })
      ]
    });

    app = TestBed.inject(FirebaseApp);
    apps = TestBed.inject(FIREBASE_APPS);
    authInstances = TestBed.inject(AUTH_INSTANCES);
  });

  afterEach(() => {
    apps.forEach(app => deleteApp(app));
  });

  describe('<constructor>', () => {

    it('should be an AngularFireAuth type', () => {
      expect(authInstances.length).toBeGreaterThan(0);
      authInstances.forEach(afAuth => {
        expect(afAuth instanceof AngularFireAuth).toEqual(true);
      });
    });

    it('should have an initialized Firebase app', () => {
      authInstances.forEach(afAuth => {
        expect(afAuth.name).toBeDefined();
      });
    });

    it('should have an initialized Firebase app instance member', () => {
      expect(authInstances.map(afAuth => afAuth.name).indexOf(firebaseAppName)).toBeGreaterThan(-1);
    });
  });

});
