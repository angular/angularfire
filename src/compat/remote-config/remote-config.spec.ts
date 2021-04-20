import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FIREBASE_APP_NAME, FIREBASE_OPTIONS, FirebaseApp } from '@angular/fire/compat';
import { AngularFireRemoteConfig, AngularFireRemoteConfigModule, DEFAULTS, SETTINGS } from '@angular/fire/compat/remote-config';
import { COMMON_CONFIG } from '../../test-config';
import { rando } from '../firestore/utils.spec';

describe('AngularFireRemoteConfig', () => {
  let app: FirebaseApp;
  let rc: AngularFireRemoteConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireRemoteConfigModule
      ]
    });

    app = TestBed.inject(FirebaseApp);
    rc = TestBed.inject(AngularFireRemoteConfig);
  });

  afterEach(() => {
    app.delete();
  });

  it('should be exist', () => {
    expect(rc instanceof AngularFireRemoteConfig).toBe(true);
  });

  it('should have the Firebase Functions instance', () => {
    expect(rc.getValue).toBeDefined();
  });

});

const FIREBASE_APP_NAME_TOO = (Math.random() + 1).toString(36).substring(7);

describe('AngularFireRemoteConfig with different app', () => {
  let app: FirebaseApp;
  let rc: AngularFireRemoteConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireRemoteConfigModule
      ],
      providers: [
        { provide: FIREBASE_APP_NAME, useValue: FIREBASE_APP_NAME_TOO },
        { provide: FIREBASE_OPTIONS, useValue: COMMON_CONFIG },
        { provide: SETTINGS, useValue: {} },
        { provide: DEFAULTS, useValue: {} }
      ]
    });

    app = TestBed.inject(FirebaseApp);
    rc = TestBed.inject(AngularFireRemoteConfig);
  });

  afterEach(() => {
    app.delete();
  });

  describe('<constructor>', () => {

    it('should be an AngularFireAuth type', () => {
      expect(rc instanceof AngularFireRemoteConfig).toEqual(true);
    });

    it('should have the Firebase Functions instance', () => {
      expect(rc.getValue).toBeDefined();
    });

  });

});
