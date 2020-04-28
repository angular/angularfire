import { inject, TestBed } from '@angular/core/testing';
import { AngularFireModule, FIREBASE_APP_NAME, FIREBASE_OPTIONS, FirebaseApp } from '@angular/fire';
import { AngularFireFunctions, AngularFireFunctionsModule, ORIGIN, REGION } from './public_api';
import { COMMON_CONFIG } from '../test-config';
import 'firebase/functions';
import { rando } from '../firestore/utils.spec';

describe('AngularFireFunctions', () => {
  let app: FirebaseApp;
  let afFns: AngularFireFunctions;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireFunctionsModule
      ]
    });
    inject([FirebaseApp, AngularFireFunctions], (app_: FirebaseApp, _fn: AngularFireFunctions) => {
      app = app_;
      afFns = _fn;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  it('should exist', () => {
    expect(afFns instanceof AngularFireFunctions).toBe(true);
  });

  it('should have the Firebase Functions instance', () => {
    expect(afFns.useFunctionsEmulator).toBeDefined();
  });

});

describe('AngularFireFunctions with different app', () => {
  let app: FirebaseApp;
  let afFns: AngularFireFunctions;
  let firebaseAppName: string;

  beforeEach(() => {
    firebaseAppName = rando();
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireFunctionsModule
      ],
      providers: [
        { provide: FIREBASE_APP_NAME, useValue: firebaseAppName },
        { provide: FIREBASE_OPTIONS, useValue: COMMON_CONFIG },
        { provide: ORIGIN, useValue: 'http://0.0.0.0:9999' },
        { provide: REGION, useValue: 'asia-northeast1' }
      ]
    });
    inject([FirebaseApp, AngularFireFunctions], (app_: FirebaseApp, _fns: AngularFireFunctions) => {
      app = app_;
      afFns = _fns;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  describe('<constructor>', () => {

    it('should be an AngularFireAuth type', () => {
      expect(afFns instanceof AngularFireFunctions).toEqual(true);
    });

    it('should have the Firebase Functions instance', () => {
      expect(afFns.useFunctionsEmulator).toBeDefined();
    });

  });

});
