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

  describe('when the factory throws', () => {

    it('should rethrow in a browser with service workers', () => {
      TestBed.configureTestingModule({
        providers: [
          provideFirebaseApp(() => initializeApp(COMMON_CONFIG, rando())),
          provideMessaging(() => { throw new Error('thrown by the factory'); }),
        ],
      });

      expect(() => TestBed.inject(Messaging)).toThrowError('thrown by the factory');
    });

  });

  describe('in a browser without service workers', () => {
    let serviceWorkerProperty: PropertyDescriptor | undefined;

    beforeEach(() => {
      // A page that is not a secure context has no `serviceWorker` property at all.
      serviceWorkerProperty = Object.getOwnPropertyDescriptor(Navigator.prototype, 'serviceWorker');
      Reflect.deleteProperty(Navigator.prototype, 'serviceWorker');

      appName = rando();
    });

    afterEach(() => {
      if (serviceWorkerProperty) {
        Object.defineProperty(Navigator.prototype, 'serviceWorker', serviceWorkerProperty);
      }
    });

    it('should inject null where getMessaging throws', () => {
      TestBed.configureTestingModule({
        providers: [
          provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
          provideMessaging(() => getMessaging(getApp(appName))),
        ],
      });

      expect('serviceWorker' in navigator).toBeFalse();
      expect(TestBed.inject(Messaging)).toBeNull();
    });

    it('should inject what the factory returns when it does not throw', () => {
      let returnedByFactory: Messaging | undefined;

      TestBed.configureTestingModule({
        providers: [
          provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
          provideMessaging(() => {
            returnedByFactory = { app: getApp(appName) };
            return returnedByFactory;
          }),
        ],
      });

      expect(TestBed.inject(Messaging)).toBe(returnedByFactory);
    });

    it('should inject null with two registrations', () => {
      TestBed.configureTestingModule({
        providers: [
          provideFirebaseApp(() => initializeApp(COMMON_CONFIG)),
          provideMessaging(() => getMessaging()),
          provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
          provideMessaging(() => getMessaging(getApp(appName))),
        ],
      });

      expect(TestBed.inject(Messaging)).toBeNull();
    });

  });

});
