import { ReflectiveInjector, Provider } from '@angular/core';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FirebaseOptionsToken, AngularFireModule, FirebaseNameOrConfigToken } from '@angular/fire';
import { AngularFireFunctions, AngularFireFunctionsModule, FUNCTIONS_REGION, FUNCTIONS_ORIGIN } from '@angular/fire/functions';
import { COMMON_CONFIG } from '../test-config';

describe('AngularFireFunctions', () => {
  let app: FirebaseApp;
  let afFns: AngularFireFunctions;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireFunctionsModule
      ]
    });
    inject([FirebaseApp, AngularFireFunctions], (app_: FirebaseApp, _fn: AngularFireFunctions) => {
      app = app_;
      afFns = _fn;
    })();
  });

  afterEach(done => {
    app.delete();
    done();
  });

  it('should exist', () => {
    expect(afFns instanceof AngularFireFunctions).toBe(true);
  });

  it('should have the Firebase Functions instance', () => {
    expect(afFns.functions).toBeDefined();
  });

});

const FIREBASE_APP_NAME_TOO = (Math.random() + 1).toString(36).substring(7);

describe('AngularFireFunctions with different app', () => {
  let app: FirebaseApp;
  let afFns: AngularFireFunctions;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireFunctionsModule
      ],
      providers: [
        { provide: FirebaseNameOrConfigToken, useValue: FIREBASE_APP_NAME_TOO },
        { provide: FirebaseOptionsToken, useValue: COMMON_CONFIG },
        { provide: FUNCTIONS_ORIGIN, useValue: 'http://0.0.0.0:9999' },
        { provide: FUNCTIONS_REGION, useValue: 'asia-northeast1' }
      ]
    });
    inject([FirebaseApp, AngularFireFunctions], (app_: FirebaseApp, _fns: AngularFireFunctions) => {
      app = app_;
      afFns = _fns;
    })();
  });

  afterEach(done => {
    app.delete();
    done();
  });

  describe('<constructor>', () => {

    it('should be an AngularFireAuth type', () => {
      expect(afFns instanceof AngularFireFunctions).toEqual(true);
    });

    it('should have the Firebase Functions instance', () => {
      expect(afFns.functions).toBeDefined();
    });

  });

});
