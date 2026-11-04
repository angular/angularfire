import { PendingTasks } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FirebaseApp, deleteApp, initializeApp, onLog, provideFirebaseApp } from '@angular/fire/app';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('FirebaseApp', () => {
  let app: FirebaseApp;
  let providedApp: FirebaseApp;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => {
                    providedApp = initializeApp(COMMON_CONFIG, appName);
                    return providedApp;
                })
            ],
        });
        app = TestBed.inject(FirebaseApp);
    });

    it('should be injectable', () => {
        expect(app).toBeTruthy();
        expect(app).toEqual(providedApp);
    });

  });

  describe('zone wrapping', () => {
    let addTask: jasmine.Spy;

    beforeEach(() => {
        addTask = spyOn(TestBed.inject(PendingTasks), 'add').and.callThrough();
    });

    afterEach(() => {
        // The handler onLog installs re-enters this test's injector, so it must not outlive the TestBed.
        TestBed.runInInjectionContext(() => onLog(null));
    });

    it('onLog does not hold the application unstable', () => {
        TestBed.runInInjectionContext(() => onLog(() => undefined));
        expect(addTask).not.toHaveBeenCalled();
    });

    it('a blocking call in the same context does register a task', async () => {
        await TestBed.runInInjectionContext(() => deleteApp(initializeApp(COMMON_CONFIG, rando())));
        expect(addTask).toHaveBeenCalled();
    });

  });

});
