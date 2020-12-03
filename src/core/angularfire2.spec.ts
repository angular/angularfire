import { TestBed } from '@angular/core/testing';
import { CompilerFactory, NgModule, NgZone, PlatformRef } from '@angular/core';
import { AngularFireModule, FirebaseApp, ɵAngularFireSchedulers, ɵkeepUnstableUntilFirstFactory, ɵZoneScheduler } from '@angular/fire';
import { Observable, of, Subject } from 'rxjs';
import { COMMON_CONFIG } from '../test-config';
import { BrowserModule } from '@angular/platform-browser';
import firebase from 'firebase/app';
import { tap } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { rando } from '../firestore/utils.spec';

describe('angularfire', () => {
  let app: FirebaseApp;
  let rootRef: firebase.database.Reference;
  let questionsRef: firebase.database.Reference;
  let listOfQuestionsRef: firebase.database.Reference;
  let defaultPlatform: PlatformRef;
  let appName: string;

  beforeEach(() => {

    appName = rando();

    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(COMMON_CONFIG, appName)]
    });

    app = TestBed.inject(FirebaseApp);
    defaultPlatform = TestBed.inject(PlatformRef);
    rootRef = app.database().ref();
    questionsRef = rootRef.child('questions');
    listOfQuestionsRef = rootRef.child('list-of-questions');
  });

  afterEach(() => {
    rootRef.remove();
    app.delete();
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
    });

    it('should re-schedule emissions asynchronously', done => {
      const keepUnstableOp = ɵkeepUnstableUntilFirstFactory(schedulers);

      let ran = false;
      of(null).pipe(
        keepUnstableOp,
        tap(() => ran = true)
      ).subscribe(() => {
        expect(ran).toEqual(true);
        done();
      }, () => fail('Should not error'));

      expect(ran).toEqual(false);
    });

    it(`should subscribe outside angular and observe inside angular`, done => {

      const keepUnstableOp = ɵkeepUnstableUntilFirstFactory(schedulers);

      insideZone.run(() => {
        new Observable(s => {
          expect(Zone.current).toEqual(outsideZone);
          s.next('test');
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

    });

    it('should block until first emission', done => {
      const testScheduler = new TestScheduler(null);
      testScheduler.run(helpers => {
        const outsideZone = Zone.current;
        // tslint:disable-next-line:no-string-literal
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
          insideAngular: new ɵZoneScheduler(insideZone, testScheduler)
        };
        const keepUnstableOp = ɵkeepUnstableUntilFirstFactory(trackingSchedulers);

        const s = new Subject();
        s.pipe(
          keepUnstableOp
        ).subscribe(() => {
        }, err => {
          fail(err);
        }, () => {
        });

        // Flush to ensure all async scheduled functions are run
        helpers.flush();
        // Should now be blocked until first item arrives
        expect(taskTrack.macroTasks.length).toBe(1);
        expect(taskTrack.macroTasks[0].source).toBe('firebaseZoneBlock');

        // Emit next item
        s.next(123);
        helpers.flush();

        // TODO drop this, it's to work around my 15ms timeout hack
        setTimeout(() => {
          // Should not be blocked after first item
          expect(taskTrack.macroTasks.length).toBe(0);
          done();
        }, 150);

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

      it('should use an already intialized firebase app if it exists', done => {
        @NgModule({
          imports: [
            AngularFireModule.initializeApp(COMMON_CONFIG, appName),
            BrowserModule
          ]
        })
        class MyModule {
          ngDoBootstrap() {
          }
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
          done();
        });
      });

    }
  });
});
