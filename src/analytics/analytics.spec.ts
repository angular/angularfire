import { TestBed } from '@angular/core/testing';
import { FirebaseApp, provideFirebaseApp, getApp, initializeApp, deleteApp } from '@angular/fire/app';
import { Analytics, provideAnalytics, getAnalytics, isSupported } from '@angular/fire/analytics';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

// TODO file a bug, seems like we got an issue with getAnalytics here.
let providedAnalytics: Analytics;

describe('Analytics', () => {
  let app: FirebaseApp;
  let analytics: Analytics;
  let appName: string;

  beforeAll(done => {
    // The APP_INITIALIZER that is making isSupported() sync for DI may not
    // be done evaulating by the time we inject from the TestBed. We can
    // ensure correct behavior by waiting for the (global) isSuppported() promise
    // to resolve.
    isSupported().then(() => done());
  });

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            imports: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideAnalytics(() => {
                    providedAnalytics ||= getAnalytics(getApp(appName));
                    return providedAnalytics;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        analytics = TestBed.inject(Analytics);
    });

    it('should be injectable', () => {
        expect(providedAnalytics).toBeTruthy();
        expect(analytics).toEqual(providedAnalytics);
        expect(analytics.app).toEqual(app);
    });

  });

});
