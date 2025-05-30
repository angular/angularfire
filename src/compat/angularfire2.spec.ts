import { CompilerFactory, DoBootstrap, NgModule, PlatformRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ɵZoneScheduler } from '@angular/fire';
import { AngularFireModule, FirebaseApp } from '@angular/fire/compat';
import { BrowserModule } from '@angular/platform-browser';
import { TestScheduler } from 'rxjs/testing';
import { COMMON_CONFIG } from '../../src/test-config';
import { rando } from '../../src/utils';

describe('angularfire', () => {
  let app: FirebaseApp;
  let defaultPlatform: PlatformRef;
  let appName: string;

  beforeEach(() => {

    appName = rando();

    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(COMMON_CONFIG, appName)]
    });

    app = TestBed.inject(FirebaseApp);
    defaultPlatform = TestBed.inject(PlatformRef);
  });

  describe('ZoneScheduler', () => {
    it('should execute the scheduled work inside the specified zone', done => {
      const ngZone = Zone.current.fork({
        name: 'ngZone'
      });
      const rootZone = Zone.current;

      // Mimic real behavior: Executing in Angular
      ngZone.run(() => {
        const outsideAngularScheduler = new ɵZoneScheduler(rootZone);
        outsideAngularScheduler.schedule(() => {
          expect(Zone.current.name).not.toEqual('ngZone');
          done();
        });
      });
    });

    it('should execute nested scheduled work inside the specified zone', done => {
      const testScheduler = new TestScheduler(null);
      testScheduler.run(helpers => {
        const outsideAngularScheduler = new ɵZoneScheduler(Zone.current, testScheduler);

        const ngZone = Zone.current.fork({
          name: 'ngZone'
        });

        let callbacksRan = 0;

        // Mimic real behavior: Executing in Angular
        ngZone.run(() => {
          outsideAngularScheduler.schedule(() => {
            callbacksRan++;
            expect(Zone.current.name).not.toEqual('ngZone');

            ngZone.run(() => {
              // Sync queueing
              outsideAngularScheduler.schedule(() => {
                callbacksRan++;
                expect(Zone.current.name).not.toEqual('ngZone');
              });

              // Async (10ms delay) nested scheduling
              outsideAngularScheduler.schedule(() => {
                callbacksRan++;
                expect(Zone.current.name).not.toEqual('ngZone');
              }, 10);

              // Simulate flush from inside angular-
              helpers.flush();
              done();
              expect(callbacksRan).toEqual(3);
            });
          });
          helpers.flush();
        });
      });
    });
  });

  describe('FirebaseApp', () => {

    it('should provide a FirebaseApp for the FirebaseApp binding', () => {
      expect(typeof app.delete).toBe('function');
    });

    if (typeof window !== 'undefined') {
      it('should have the provided name', () => {
        expect(app.name).toBe(appName);
      });
    }
  });
});
