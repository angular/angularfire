import { inject, TestBed } from '@angular/core/testing';
import { AngularFireModule, FirebaseApp } from '@angular/fire';
import { AngularFireAnalytics, AngularFireAnalyticsModule } from './public_api';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../firestore/utils.spec';


describe('AngularFireAnalytics', () => {
  let app: FirebaseApp;
  let analytics: AngularFireAnalytics;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireAnalyticsModule
      ]
    });
    inject([FirebaseApp, AngularFireAnalytics], (app_: FirebaseApp, _analytics: AngularFireAnalytics) => {
      app = app_;
      analytics = _analytics;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  it('should be exist', () => {
    expect(analytics instanceof AngularFireAnalytics).toBe(true);
  });

  it('should have the Firebase Functions instance', () => {
    expect(analytics.app).toBeDefined();
  });

});
