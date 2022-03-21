import { TestBed } from '@angular/core/testing';
import { FirebaseApp, provideFirebaseApp, getApp, initializeApp, deleteApp } from '@angular/fire/app';
import { Auth, provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { COMMON_CONFIG } from '../test-config';
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
            imports: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideAuth(() => {
                    providedAuth = getAuth(getApp(appName));
                    connectAuthEmulator(providedAuth, 'http://localhost:9099');
                    return providedAuth;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        auth = TestBed.inject(Auth);
    });

    afterEach(() => {
        try { deleteApp(app).catch(() => undefined); } catch (e) { }
    });

    it('should be injectable', () => {
        expect(providedAuth).toBeTruthy();
        expect(auth).toEqual(providedAuth);
        expect(auth.app).toEqual(app);
    });

  });

});
