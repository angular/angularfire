import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { Auth, connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { COMMON_CONFIG, authEmulatorPort } from '../test-config';
import { rando } from '../utils';

describe('Auth', () => {
  let app: FirebaseApp;
  let auth: Auth;
  let providedAuth: Auth;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideAuth(() => {
                    providedAuth = getAuth(getApp(appName));
                    connectAuthEmulator(providedAuth, `http://localhost:${authEmulatorPort}`, { disableWarnings: true });
                    return providedAuth;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        auth = TestBed.inject(Auth);
    });

    it('should be injectable', () => {
        expect(providedAuth).toBeTruthy();
        expect(auth).toEqual(providedAuth);
        expect(auth.app).toEqual(app);
    });

  });

});
