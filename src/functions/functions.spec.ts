import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { Functions, connectFunctionsEmulator, getFunctions, provideFunctions } from '@angular/fire/functions';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('Functions', () => {
  let app: FirebaseApp;
  let functions: Functions;
  let providedFunctions: Functions;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideFunctions(() => {
                    providedFunctions = getFunctions(getApp(appName));
                    connectFunctionsEmulator(providedFunctions, 'localhost', 5001);
                    return providedFunctions;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        functions = TestBed.inject(Functions);
    });

    it('should be injectable', () => {
        expect(providedFunctions).toBeTruthy();
        expect(functions).toEqual(providedFunctions);
        expect(functions.app).toEqual(app);
    });

  });

});
