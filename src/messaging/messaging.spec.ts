import { TestBed } from '@angular/core/testing';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { Messaging, getMessaging, isSupported, provideMessaging } from '@angular/fire/messaging';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('Messaging', () => {
  let messaging: Messaging;
  let providedMessaging: Messaging;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideMessaging(() => {
                    providedMessaging = getMessaging(getApp(appName));
                    return providedMessaging;
                }),
            ],
        });
        messaging = TestBed.inject(Messaging);
    });

    it('should be injectable', async () => {
      const supported = await TestBed.runInInjectionContext(isSupported);
      if (supported) {
        expect(providedMessaging).toBeTruthy();
        expect(messaging).toEqual(providedMessaging);
      } else {
        expect(providedMessaging).toBeUndefined();
        expect(messaging).toBeNull();
      }
    });

  });

});
