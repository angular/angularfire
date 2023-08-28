import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FirebaseApp } from '@angular/fire/compat';
import { AngularFirePerformance, AngularFirePerformanceModule } from '@angular/fire/compat/performance';
import { COMMON_CONFIG } from '../../../src/test-config';

describe('AngularFirePerformance', () => {
  let app: FirebaseApp;
  let afp: AngularFirePerformance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        // NOTE: You must use the [DEFAULT] app instance 
        // for these tests to work.
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFirePerformanceModule
      ]
    });
    app = TestBed.inject(FirebaseApp);
    afp = TestBed.inject(AngularFirePerformance);
  });

  it('should exist', () => {
    expect(afp instanceof AngularFirePerformance).toBe(true);
  });

  it('should have the Performance instance', () => {
    expect(afp.dataCollectionEnabled).toBeDefined();
  });

});
