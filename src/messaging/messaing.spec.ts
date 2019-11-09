import { ReflectiveInjector, Provider } from '@angular/core';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FirebaseOptionsToken, AngularFireModule, FirebaseNameOrConfigToken } from '@angular/fire';
import { AngularFireMessaging, AngularFireMessagingModule } from '@angular/fire/messaging';
import { COMMON_CONFIG } from './test-config';

describe('AngularFireMessaging', () => {
  let app: FirebaseApp;
  let afm: AngularFireMessaging;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireMessagingModule
      ]
    });
    inject([FirebaseApp, AngularFireMessaging], (app_: FirebaseApp, _afm: AngularFireMessaging) => {
      app = app_;
      afm = _afm;
    })();
  });

  afterEach(done => {
    app.delete();
    done();
  });

  it('should be exist', () => {
    expect(afm instanceof AngularFireMessaging).toBe(true);
  });

  it('should have the FCM instance', () => {
    expect(afm.messaging).toBeDefined();
  });

});

const FIREBASE_APP_NAME_TOO = (Math.random() + 1).toString(36).substring(7);

describe('AngularFireMessaging with different app', () => {
  let app: FirebaseApp;
  let afm: AngularFireMessaging;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireMessagingModule
      ],
      providers: [
        { provide: FirebaseNameOrConfigToken, useValue: FIREBASE_APP_NAME_TOO },
        { provide: FirebaseOptionsToken, useValue: COMMON_CONFIG }
      ]
    });
    inject([FirebaseApp, AngularFireMessaging], (app_: FirebaseApp, _afm: AngularFireMessaging) => {
      app = app_;
      afm = _afm;
    })();
  });

  afterEach(done => {
    app.delete();
    done();
  });

  describe('<constructor>', () => {

    it('should be an AngularFireMessaging type', () => {
      expect(afm instanceof AngularFireMessaging).toEqual(true);
    });

    it('should have the FCM instance', () => {
      expect(afm.messaging).toBeDefined();
    });

  });

});
