import { TestBed } from '@angular/core/testing';
import { FirebaseApp, provideFirebaseApp, initializeApp, deleteApp } from '@angular/fire/app';
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
            imports: [
                provideFirebaseApp(() => {
                    providedApp = initializeApp(COMMON_CONFIG, appName);
                    return providedApp;
                })
            ],
        });
        app = TestBed.inject(FirebaseApp);
    });

    afterEach(() => {
        try { deleteApp(app).catch(() => undefined); } catch (e) { }
    });

    it('should be injectable', () => {
        expect(app).toBeTruthy();
        expect(app).toEqual(providedApp);
    });

  });

});
