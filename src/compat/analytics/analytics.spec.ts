import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FirebaseApp } from '@angular/fire/compat';
import { AngularFireAnalytics, AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';
import { COMMON_CONFIG } from '../../test-config';
import { rando } from '../../utils';


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

    app = TestBed.inject(FirebaseApp);
    analytics = TestBed.inject(AngularFireAnalytics);
  });

  afterEach(() => {
     try { app.delete().catch(() => undefined); } catch (e) { }
  });

  it('should be exist', () => {
    expect(analytics instanceof AngularFireAnalytics).toBe(true);
  });

  it('should have the Firebase Functions instance', () => {
    expect(analytics.app).toBeDefined();
  });

});
