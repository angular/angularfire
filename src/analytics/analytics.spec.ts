import { TestBed } from '@angular/core/testing';
import { FirebaseApp, provideFirebaseApp, getApp, initializeApp, deleteApp } from '@angular/fire/app';
import { Analytics, provideAnalytics, getAnalytics } from '@angular/fire/analytics';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('Analytics', () => {
  let app: FirebaseApp;
  let analytics: Analytics;
  let providedAnalytics: Analytics;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            imports: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideAnalytics(() => {
                    providedAnalytics = getAnalytics(getApp(appName));
                    return providedAnalytics;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        analytics = TestBed.inject(Analytics);
    });

    afterEach(() => {
        deleteApp(app).catch(() => undefined);
    });

    it('should be injectable', () => {
        expect(providedAnalytics).toBeTruthy();
        expect(analytics).toEqual(providedAnalytics);
        expect(analytics.app).toEqual(app);
    });

  });

});
