import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, AngularFireModule } from '@angular/fire';
import { AngularFirePerformance, AngularFirePerformanceModule } from './public_api';
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
    inject([FirebaseApp, AngularFirePerformance], (app_: FirebaseApp, _perf: AngularFirePerformance) => {
      app = app_;
      afp = _perf;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  it('should exist', () => {
    expect(afp instanceof AngularFirePerformance).toBe(true);
  });

  it('should have the Performance instance', () => {
    expect(afp.dataCollectionEnabled).toBeDefined();
  });

});
