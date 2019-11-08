import { ReflectiveInjector, Provider } from '@angular/core';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FirebaseOptionsToken, AngularFireModule, FirebaseNameOrConfigToken } from '@angular/fire';
import { AngularFireRemoteConfig, AngularFireRemoteConfigModule, REMOTE_CONFIG_SETTINGS, DEFAULT_CONFIG } from '@angular/fire/remote-config';
import { COMMON_CONFIG } from './test-config';

describe('AngularFireRemoteConfig', () => {
  let app: FirebaseApp;
  let rc: AngularFireRemoteConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireRemoteConfigModule
      ]
    });
    inject([FirebaseApp, AngularFireRemoteConfig], (app_: FirebaseApp, _rc: AngularFireRemoteConfig) => {
      app = app_;
      rc = _rc;
    })();
  });

  afterEach(done => {
    app.delete();
    done();
  });

  it('should be exist', () => {
    expect(rc instanceof AngularFireRemoteConfig).toBe(true);
  });

  it('should have the Firebase Functions instance', () => {
    expect(rc.remoteConfig).toBeDefined();
  });

});

const FIREBASE_APP_NAME_TOO = (Math.random() + 1).toString(36).substring(7);

describe('AngularFireRemoteConfig with different app', () => {
  let app: FirebaseApp;
  let rc: AngularFireRemoteConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireRemoteConfigModule
      ],
      providers: [
        { provide: FirebaseNameOrConfigToken, useValue: FIREBASE_APP_NAME_TOO },
        { provide: FirebaseOptionsToken, useValue: COMMON_CONFIG },
        { provide: REMOTE_CONFIG_SETTINGS, useValue: {} },
        { provide: DEFAULT_CONFIG, useValue: {} }
      ]
    });
    inject([FirebaseApp, AngularFireRemoteConfig], (app_: FirebaseApp, _rc: AngularFireRemoteConfig) => {
      app = app_;
      rc = _rc;
    })();
  });

  afterEach(done => {
    app.delete();
    done();
  });

  describe('<constructor>', () => {

    it('should be an AngularFireAuth type', () => {
      expect(rc instanceof AngularFireRemoteConfig).toEqual(true);
    });

    it('should have the Firebase Functions instance', () => {
      expect(rc.remoteConfig).toBeDefined();
    });

  });

});
