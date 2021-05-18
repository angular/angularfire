import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FirebaseApp } from '@angular/fire';
import { AngularFirePerformance, AngularFirePerformanceModule } from '@angular/fire/performance';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../firestore/utils.spec';

describe('AngularFirePerformance', () => {
  let app: FirebaseApp;
  let afp: AngularFirePerformance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFirePerformanceModule
      ]
    });

    app = TestBed.inject(FirebaseApp);
    afp = TestBed.inject(AngularFirePerformance);
  });

  afterEach(() => {
    app.delete().catch();
  });

  it('should exist', () => {
    expect(afp instanceof AngularFirePerformance).toBe(true);
  });

  it('should have the Performance instance', () => {
    expect(afp.dataCollectionEnabled).toBeDefined();
  });

});
