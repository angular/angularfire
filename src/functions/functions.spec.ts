import { ReflectiveInjector, Provider } from '@angular/core';
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { Observer } from 'rxjs/Observer';
import { TestBed, inject } from '@angular/core/testing';
import { _do } from 'rxjs/operator/do';
import { take } from 'rxjs/operator/take';
import { skip } from 'rxjs/operator/skip';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule, FirebaseAppName } from 'angularfire2';
import { AngularFireFunctions, AngularFireFunctionsModule } from 'angularfire2/functions';
import { COMMON_CONFIG } from './test-config';

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
    afFns.functions.app.delete().then(done, done.fail);
  });

  it('should be exist', () => {
    expect(afFns instanceof AngularFireFunctions).toBe(true);
  });

  it('should have the Firebase Functions instance', () => {
    expect(afFns.functions).toBeDefined();
  });

  it('should have an initialized Firebase app', () => {
    expect(afFns.functions.app).toBeDefined();
    expect(afFns.functions.app).toEqual(app);
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
        { provide: FirebaseAppName, useValue: FIREBASE_APP_NAME_TOO },
        { provide: FirebaseAppConfig, useValue:  COMMON_CONFIG }
      ]
    });
    inject([FirebaseApp, AngularFireFunctions], (app_: FirebaseApp, _fns: AngularFireFunctions) => {
      app = app_;
      afFns = _fns;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  describe('<constructor>', () => {

    it('should be an AngularFireAuth type', () => {
      expect(afFns instanceof AngularFireFunctions).toEqual(true);
    });

    it('should have an initialized Firebase app', () => {
      expect(afFns.functinos.app).toBeDefined();
      expect(afFns.functinos.app).toEqual(app);
    });

    it('should have an initialized Firebase app instance member', () => {
      expect(afFns.functinos.app.name).toEqual(FIREBASE_APP_NAME_TOO);
    });
  });

});
