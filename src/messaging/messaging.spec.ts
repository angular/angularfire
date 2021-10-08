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
    // be done evaulating by the time we inject from the TestBed guard the
    // functionality by ensuring that the (global) promise has resolved.
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

    afterEach(() => {
        deleteApp(app).catch(() => undefined);
    });

    it('should be injectable', () => {
        expect(providedMessaging).toBeTruthy();
        expect(messaging).toEqual(providedMessaging);
    });

  });

});
