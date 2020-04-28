import { User } from 'firebase/app';
import { Observable, Subject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FIREBASE_APP_NAME, FIREBASE_OPTIONS, FirebaseApp } from '@angular/fire';
import { AngularFireAuth, AngularFireAuthModule } from './public_api';
import { COMMON_CONFIG } from '../test-config';
import 'firebase/auth';
import { rando } from '../firestore/utils.spec';

const firebaseUser = {
  uid: '12345',
  providerData: [{ displayName: 'jeffbcrossyface' }]
} as User;

describe('AngularFireAuth', () => {
  let app: FirebaseApp;
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
    app.delete();
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
    expect(afAuth.app).toBeDefined();
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

    app = TestBed.inject(FirebaseApp);
    afAuth = TestBed.inject(AngularFireAuth);
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
