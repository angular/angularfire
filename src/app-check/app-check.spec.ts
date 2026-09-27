import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { APP_CHECK_ON_SERVER, AppCheck, CustomProvider, initializeAppCheck, provideAppCheck } from '@angular/fire/app-check';
import { Auth, connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('Auth', () => {
  let app: FirebaseApp;
  let auth: Auth;
  let providedAuth: Auth;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
          providers: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideAuth(() => {
                    providedAuth = getAuth(getApp(appName));
                    connectAuthEmulator(providedAuth, 'http://localhost:9098');
                    return providedAuth;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        auth = TestBed.inject(Auth);
    });

    it('should be injectable', () => {
        expect(auth).toBeTruthy();
        expect(auth).toEqual(providedAuth);
        expect(auth.app).toEqual(app);
    });

  });

});

describe('AppCheck', () => {
  let appName: string;
  let setupCalls: number;

  const provideTestAppCheck = () => provideAppCheck(() => {
    setupCalls++;
    return initializeAppCheck(getApp(appName), {
      provider: new CustomProvider({ getToken: () => Promise.resolve({ token: 'test-token', expireTimeMillis: Date.now() + 3_600_000 }) }),
    });
  });

  beforeEach(() => {
    appName = rando();
    setupCalls = 0;
  });

  it('should skip App Check during server rendering by default', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
        provideTestAppCheck(),
      ],
    });
    expect(TestBed.inject(AppCheck)).toBeNull();
    expect(setupCalls).toBe(0);
  });

  it('should skip every App Check setup during server rendering when provided more than once', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
        provideTestAppCheck(),
        provideTestAppCheck(),
      ],
    });
    expect(TestBed.inject(AppCheck)).toBeNull();
    expect(setupCalls).toBe(0);
  });

  it('should run App Check during server rendering when APP_CHECK_ON_SERVER is true', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: APP_CHECK_ON_SERVER, useValue: true },
        provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
        provideTestAppCheck(),
      ],
    });
    const appCheck = TestBed.inject(AppCheck);
    expect(setupCalls).toBe(1);
    expect(appCheck).toBeTruthy();
    expect(appCheck.app).toEqual(TestBed.inject(FirebaseApp));
  });

  it('should run App Check in the browser', () => {
    TestBed.configureTestingModule({
      providers: [
        provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
        provideTestAppCheck(),
      ],
    });
    const appCheck = TestBed.inject(AppCheck);
    expect(setupCalls).toBe(1);
    expect(appCheck).toBeTruthy();
    expect(appCheck.app).toEqual(TestBed.inject(FirebaseApp));
  });

});
