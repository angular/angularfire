import { ReflectiveInjector, Provider } from '@angular/core';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FirebaseOptionsToken, AngularFireModule, FirebaseNameOrConfigToken } from '@angular/fire';
import { AngularFireAnalytics, AngularFireAnalyticsModule, COLLECTION_ENABLED, APP_VERSION, APP_NAME } from '@angular/fire/analytics';
import { COMMON_CONFIG } from './test-config';


describe('AngularFireAnalytics', () => {
  let app: FirebaseApp;
  let analytics: AngularFireAnalytics;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireAnalyticsModule
      ]
    });
    inject([FirebaseApp, AngularFireAnalytics], (app_: FirebaseApp, _analytics: AngularFireAnalytics) => {
      app = app_;
      analytics = _analytics;
    })();
  });

  afterEach(done => {
    app.delete();
    done();
  });

  it('should be exist', () => {
    expect(analytics instanceof AngularFireAnalytics).toBe(true);
  });

  it('should have the Firebase Functions instance', () => {
    expect(analytics.app).toBeDefined();
  });

});

const FIREBASE_APP_NAME_TOO = (Math.random() + 1).toString(36).substring(7);

describe('AngularFireAnalytics with different app', () => {
  let app: FirebaseApp;
  let analytics: AngularFireAnalytics;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireAnalyticsModule
      ],
      providers: [
        { provide: FirebaseNameOrConfigToken, useValue: FIREBASE_APP_NAME_TOO },
        { provide: FirebaseOptionsToken, useValue: COMMON_CONFIG },
        { provide: COLLECTION_ENABLED, useValue: true },
        { provide: APP_VERSION, useValue: '0.0' },
        { provide: APP_NAME, useValue: 'Test App!' }
      ]
    });
    inject([FirebaseApp, AngularFireAnalytics], (app_: FirebaseApp, _analytics: AngularFireAnalytics) => {
      app = app_;
      analytics = _analytics;
    })();
  });

  afterEach(done => {
    app.delete();
    done();
  });

  describe('<constructor>', () => {

    it('should be an AngularFireAuth type', () => {
      expect(analytics instanceof AngularFireAnalytics).toEqual(true);
    });

    it('should have the Firebase Functions instance', () => {
      expect(analytics.app).toBeDefined();
    });

  });

});
