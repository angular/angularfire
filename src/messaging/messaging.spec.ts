import { TestBed } from '@angular/core/testing';
import { FirebaseApp, provideFirebaseApp, getApp, initializeApp, deleteApp } from '@angular/fire/app';
import { Messaging, provideMessaging, getMessaging, isSupported } from '@angular/fire/messaging';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('Messaging', () => {
  let app: FirebaseApp;
  let messaging: Messaging;
  let providedMessaging: Messaging;
  let appName: string;

  beforeAll(done => {
    // The APP_INITIALIZER that is making isSupported() sync for DI may not
    // be done evaulating by the time we inject from the TestBed. We can
    // ensure correct behavior by waiting for the (global) isSuppported() promise
    // to resolve.
    isSupported().then(() => done());
  });

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            imports: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideMessaging(() => {
                    providedMessaging = getMessaging(getApp(appName));
                    return providedMessaging;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        messaging = TestBed.inject(Messaging);
    });

    it('should be injectable', () => {
        expect(providedMessaging).toBeTruthy();
        expect(messaging).toEqual(providedMessaging);
    });

  });

});
