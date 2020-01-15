import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, AngularFireModule } from '@angular/fire';
import { AngularFirePerformance, AngularFirePerformanceModule } from './public_api';
import { COMMON_CONFIG } from '../test-config';

describe('AngularFirePerformance', () => {
  let app: FirebaseApp;
  let afp: AngularFirePerformance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFirePerformanceModule
      ]
    });
    inject([FirebaseApp, AngularFirePerformance], (app_: FirebaseApp, _perf: AngularFirePerformance) => {
      app = app_;
      afp = _perf;
    })();
  });

  afterEach(done => {
    app.delete();
    done();
  });

  it('should exist', () => {
    expect(afp instanceof AngularFirePerformance).toBe(true);
  });

  it('should have the Performance instance', () => {
    expect(afp.dataCollectionEnabled).toBeDefined();
  });

});
