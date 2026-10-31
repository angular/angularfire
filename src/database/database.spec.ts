import { PendingTasks } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  DataSnapshot,
  Database,
  ListenEvent,
  Query,
  Unsubscribe,
  auditTrail,
  connectDatabaseEmulator,
  enableLogging,
  fromRef,
  getDatabase,
  list,
  off,
  onChildAdded,
  onChildChanged,
  onChildMoved,
  onChildRemoved,
  onValue,
  provideDatabase,
  ref,
  stateChanges,
} from '@angular/fire/database';
import { COMMON_CONFIG, databaseEmulatorPort } from '../test-config';
import { rando } from '../utils';

describe('Database', () => {
  let app: FirebaseApp;
  let database: Database;
  let providedDatabase: Database;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideDatabase(() => {
                    providedDatabase = getDatabase(getApp(appName));
                    connectDatabaseEmulator(providedDatabase, 'localhost', databaseEmulatorPort);
                    return providedDatabase;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        database = TestBed.inject(Database);
    });

    it('should be injectable', () => {
        expect(providedDatabase).toBeTruthy();
        expect(database).toEqual(providedDatabase);
        expect(database.app).toEqual(app);
    });

    describe('zone wrapping', () => {
      let addTask: jasmine.Spy;
      let cleanups: (() => void)[];

      beforeEach(() => {
          addTask = spyOn(TestBed.inject(PendingTasks), 'add').and.callThrough();
          cleanups = [];
      });

      afterEach(() => {
          // Listeners re-enter this test's injector, so none may outlive the TestBed.
          cleanups.forEach(cleanup => cleanup());
      });

      type ChildListener = (query: Query, callback: (snapshot: DataSnapshot) => void) => Unsubscribe;
      const childListeners: [string, ChildListener][] = [
          ['onChildAdded', onChildAdded],
          ['onChildChanged', onChildChanged],
          ['onChildMoved', onChildMoved],
          ['onChildRemoved', onChildRemoved],
      ];
      childListeners.forEach(([name, listen]) => {
          it(`${name} does not hold the application unstable`, () => {
              const unsubscribe = TestBed.runInInjectionContext(() => listen(ref(database, rando()), () => undefined));
              cleanups.push(unsubscribe);
              expect(addTask).not.toHaveBeenCalled();
          });
      });

      it('off does not hold the application unstable', () => {
          TestBed.runInInjectionContext(() => off(ref(database, rando()), 'value', () => undefined));
          expect(addTask).not.toHaveBeenCalled();
      });

      it('enableLogging does not hold the application unstable', () => {
          TestBed.runInInjectionContext(() => enableLogging(() => undefined));
          cleanups.push(() => TestBed.runInInjectionContext(() => enableLogging(false)));
          expect(addTask).not.toHaveBeenCalled();
      });

      [ListenEvent.added, ListenEvent.changed, ListenEvent.moved, ListenEvent.removed].forEach(event => {
          it(`fromRef on ${event} does not hold the application unstable`, () => {
              const subscription = TestBed.runInInjectionContext(() => fromRef(ref(database, rando()), event)).subscribe();
              cleanups.push(() => subscription.unsubscribe());
              expect(addTask).not.toHaveBeenCalled();
          });
      });

      it('fromRef on the value event registers a pending task', () => {
          const subscription = TestBed.runInInjectionContext(() => fromRef(ref(database, rando()), ListenEvent.value)).subscribe();
          cleanups.push(() => subscription.unsubscribe());
          expect(addTask).toHaveBeenCalledTimes(1);
      });

      it('stateChanges does not hold the application unstable', () => {
          const subscription = TestBed.runInInjectionContext(() => stateChanges(ref(database, rando()))).subscribe();
          cleanups.push(() => subscription.unsubscribe());
          expect(addTask).not.toHaveBeenCalled();
      });

      it('auditTrail does not hold the application unstable', () => {
          const subscription = TestBed.runInInjectionContext(() => auditTrail(ref(database, rando()))).subscribe();
          cleanups.push(() => subscription.unsubscribe());
          expect(addTask).not.toHaveBeenCalled();
      });

      it('onValue in the same context does register a task', () => {
          const unsubscribe = TestBed.runInInjectionContext(() => onValue(ref(database, rando()), () => undefined));
          cleanups.push(unsubscribe);
          expect(addTask).toHaveBeenCalledTimes(1);
      });

      it('list in the same context does register a task', () => {
          const subscription = TestBed.runInInjectionContext(() => list(ref(database, rando()))).subscribe();
          cleanups.push(() => subscription.unsubscribe());
          expect(addTask).toHaveBeenCalledTimes(1);
      });

    });

  });

});
