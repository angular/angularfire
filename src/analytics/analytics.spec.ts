import { TestBed } from '@angular/core/testing';
import { Analytics, getAnalytics, isSupported, provideAnalytics } from '@angular/fire/analytics';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { COMMON_CONFIG_TOO } from '../test-config';
import { rando } from '../utils';

describe('Analytics', () => {
  let app: FirebaseApp;
  let analytics: Analytics;
  let providedAnalytics: Analytics;
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
            providers: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG_TOO, appName)),
                provideAnalytics(() => {
                    providedAnalytics = getAnalytics(getApp(appName));
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
