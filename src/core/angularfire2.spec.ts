import { TestBed, inject } from '@angular/core/testing';
import { PlatformRef, NgModule, CompilerFactory, NgZone } from '@angular/core';
import { FirebaseApp, AngularFireModule } from './public_api';
import { Subscription, Observable, Subject, of } from 'rxjs';
import { COMMON_CONFIG } from '../test-config';
import { BrowserModule } from '@angular/platform-browser';
import { database } from 'firebase/app';
import { ɵZoneScheduler, ɵkeepUnstableUntilFirstFactory, ɵAngularFireSchedulers } from './angularfire2';
import { ɵPLATFORM_BROWSER_ID, ɵPLATFORM_SERVER_ID } from '@angular/common';
import { tap  } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { rando } from '../firestore/utils.spec';

describe('angularfire', () => {
  let subscription:Subscription;
  let app: FirebaseApp;
  let rootRef: database.Reference;
  let questionsRef: database.Reference;
  let listOfQuestionsRef: database.Reference;
  let defaultPlatform: PlatformRef;
  let appName:string;

  beforeEach(() => {

    appName = rando();

    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(COMMON_CONFIG, appName)]
    });

    inject([FirebaseApp, PlatformRef], (_app: FirebaseApp, _platform: PlatformRef) => {
      app = _app;
      rootRef = app.database!().ref();
      questionsRef = rootRef.child('questions');
      listOfQuestionsRef = rootRef.child('list-of-questions');
      defaultPlatform = _platform;
    })();

  });

  afterEach(() => {
    rootRef.remove()
    if(subscription && !subscription.closed) {
      subscription.unsubscribe();
    }
    app.delete();
  });

  describe('ZoneScheduler', () => {
    it('should execute the scheduled work inside the specified zone', done => {
      let ngZone = Zone.current.fork({
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
      const testScheduler = new TestScheduler(null!);
      testScheduler.run(helpers => {
        const outsideAngularScheduler = new ɵZoneScheduler(Zone.current, testScheduler);

        let ngZone = Zone.current.fork({
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
            })
          });
          helpers.flush();
        });
      });
    })
  })

  describe('keepUnstableUntilFirstFactory', () => {
    let schedulers: ɵAngularFireSchedulers;
    let outsideZone: Zone;
    let insideZone: Zone;
    beforeAll(() => {
      outsideZone = Zone.current;
      insideZone = Zone.current.fork({
        name: 'ngZone'
      });
      const ngZone = {
        run: insideZone.run.bind(insideZone),
        runGuarded: insideZone.runGuarded.bind(insideZone),
        runOutsideAngular: outsideZone.runGuarded.bind(outsideZone),
        runTask: insideZone.run.bind(insideZone)
      } as NgZone;
      schedulers = new ɵAngularFireSchedulers(ngZone);
    })

    it('should re-schedule emissions asynchronously', done => {
      const keepUnstableOp = ɵkeepUnstableUntilFirstFactory(schedulers, ɵPLATFORM_SERVER_ID);

      let ran = false;
      of(null).pipe(
        keepUnstableOp,
        tap(() => ran = true)
      ).subscribe(() => {
        expect(ran).toEqual(true);
        done();
      }, () => fail("Should not error"));

      expect(ran).toEqual(false);
    });

    [ɵPLATFORM_SERVER_ID, ɵPLATFORM_BROWSER_ID].map(platformId =>
      it(`should subscribe outside angular and observe inside angular (${platformId})`, done => {
        const keepUnstableOp = ɵkeepUnstableUntilFirstFactory(schedulers, platformId);

        insideZone.run(() => {
          new Observable(s => {
            expect(Zone.current).toEqual(outsideZone);
            s.next("test");
          }).pipe(
            keepUnstableOp,
            tap(() => {
              expect(Zone.current).toEqual(insideZone);
            })
          ).subscribe(() => {
            expect(Zone.current).toEqual(insideZone);
            done();
          }, err => {
            fail(err);
          });
        });
      })
    );

    it('should block until first emission on server platform', done => {
      const testScheduler = new TestScheduler(null!);
      testScheduler.run(helpers => {
        const outsideZone = Zone.current;
        const taskTrack = new Zone['TaskTrackingZoneSpec']();
        const insideZone = Zone.current.fork(taskTrack);
        const trackingSchedulers: ɵAngularFireSchedulers = {
          ngZone: {
            run: insideZone.run.bind(insideZone),
            runGuarded: insideZone.runGuarded.bind(insideZone),
            runOutsideAngular: outsideZone.runGuarded.bind(outsideZone),
            runTask: insideZone.run.bind(insideZone)
          } as NgZone,
          outsideAngular: new ɵZoneScheduler(outsideZone, testScheduler),
          insideAngular: new ɵZoneScheduler(insideZone, testScheduler),
        };
        const keepUnstableOp = ɵkeepUnstableUntilFirstFactory(trackingSchedulers, ɵPLATFORM_SERVER_ID);

        const s = new Subject();
        s.pipe(
          keepUnstableOp,
        ).subscribe(() => { }, err => { fail(err); }, () => { });

        // Flush to ensure all async scheduled functions are run
        helpers.flush();
        // Should now be blocked until first item arrives
        expect(taskTrack.macroTasks.length).toBe(1);
        expect(taskTrack.macroTasks[0].source).toBe('firebaseZoneBlock');

        // Emit next item
        s.next(123);
        helpers.flush();

        // Should not be blocked after first item
        expect(taskTrack.macroTasks.length).toBe(0);

        done();
      });
    })

    it('should not block on client platform', done => {
      const testScheduler = new TestScheduler(null!);
      testScheduler.run(helpers => {
        const outsideZone = Zone.current;
        const taskTrack = new Zone['TaskTrackingZoneSpec']();
        const insideZone = Zone.current.fork(taskTrack);
        const trackingSchedulers: ɵAngularFireSchedulers = {
          ngZone: {
            run: insideZone.run.bind(insideZone),
            runGuarded: insideZone.runGuarded.bind(insideZone),
            runOutsideAngular: outsideZone.runGuarded.bind(outsideZone),
            runTask: insideZone.run.bind(insideZone)
          } as NgZone,
          outsideAngular: new ɵZoneScheduler(outsideZone, testScheduler),
          insideAngular: new ɵZoneScheduler(insideZone, testScheduler),
        };
        const keepUnstableOp = ɵkeepUnstableUntilFirstFactory(trackingSchedulers, ɵPLATFORM_BROWSER_ID);

        const s = new Subject();
        s.pipe(
          keepUnstableOp,
        ).subscribe(() => { }, err => { fail(err); }, () => { });

        // Flush to ensure all async scheduled functions are run
        helpers.flush();

        // Zone should not be blocked
        expect(taskTrack.macroTasks.length).toBe(0);
        expect(taskTrack.microTasks.length).toBe(0);

        done();
      });
    })
  })

  describe('FirebaseApp', () => {

    it('should provide a FirebaseApp for the FirebaseApp binding', () => {
      expect(typeof app.delete).toBe('function');
    });

    if (typeof window !== 'undefined') {

      it('should have the provided name', () => {
        expect(app.name).toBe(appName);
      });

      it('should use an already intialized firebase app if it exists', done => {
        @NgModule({
          imports: [
            AngularFireModule.initializeApp(COMMON_CONFIG, appName),
            BrowserModule
          ]})
        class MyModule {
          ngDoBootstrap() {}
        }

        const compilerFactory: CompilerFactory =
            defaultPlatform.injector.get(CompilerFactory, null);
        const moduleFactory = compilerFactory.createCompiler().compileModuleSync(MyModule);

        defaultPlatform.bootstrapModuleFactory(moduleFactory)
          .then(moduleRef => {
            const ref = moduleRef.injector.get(FirebaseApp);
            expect(ref.name).toEqual(app.name);
          }).then(done, e => {
            fail(e);
            done()
          });
      })

    }
  });
});
