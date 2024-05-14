import { TestBed } from '@angular/core/testing';
import { FirebaseApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { Performance, getPerformance, providePerformance } from '@angular/fire/performance';
import { COMMON_CONFIG } from '../test-config';

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

    it('should be injectable', () => {
        expect(providedPerformance).toBeTruthy();
        expect(performance).toEqual(providedPerformance);
        expect(performance.app).toEqual(app);
    });

  });

});
