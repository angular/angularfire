import { TestBed } from '@angular/core/testing';
import { FirebaseApp, provideFirebaseApp, initializeApp, deleteApp } from '@angular/fire/app';
import { Performance, providePerformance, getPerformance } from '@angular/fire/performance';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('Performance', () => {
  let app: FirebaseApp;
  let performance: Performance;
  let providedPerformance: Performance;

  describe('single injection', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG)),
                providePerformance(() => {
                    providedPerformance = getPerformance();
                    return providedPerformance;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        performance = TestBed.inject(Performance);
    });

    afterEach(() => {
    });

    it('should be injectable', () => {
        expect(providedPerformance).toBeTruthy();
        expect(performance).toEqual(providedPerformance);
        expect(performance.app).toEqual(app);
    });

  });

});
