import { ReflectiveInjector, Provider } from '@angular/core';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FIREBASE_OPTIONS, AngularFireModule, FIREBASE_APP_NAME } from '@angular/fire';
import { AngularFireMessaging, AngularFireMessagingModule } from './public_api';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../firestore/utils.spec';

describe('AngularFireMessaging', () => {
  let app: FirebaseApp;
  let afm: AngularFireMessaging;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireMessagingModule
      ]
    });
    inject([FirebaseApp, AngularFireMessaging], (app_: FirebaseApp, _afm: AngularFireMessaging) => {
      app = app_;
      afm = _afm;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  it('should be exist', () => {
    expect(afm instanceof AngularFireMessaging).toBe(true);
  });

  it('should have the FCM instance', () => {
    expect(afm.deleteToken).toBeDefined();
  });

});

const FIREBASE_APP_NAME_TOO = (Math.random() + 1).toString(36).substring(7);

describe('AngularFireMessaging with different app', () => {
  let app: FirebaseApp;
  let afm: AngularFireMessaging;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireMessagingModule
      ],
      providers: [
        { provide: FIREBASE_APP_NAME, useValue: FIREBASE_APP_NAME_TOO },
        { provide: FIREBASE_OPTIONS, useValue: COMMON_CONFIG }
      ]
    });
    inject([FirebaseApp, AngularFireMessaging], (app_: FirebaseApp, _afm: AngularFireMessaging) => {
      app = app_;
      afm = _afm;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  describe('<constructor>', () => {

    it('should be an AngularFireMessaging type', () => {
      expect(afm instanceof AngularFireMessaging).toEqual(true);
    });

    it('should have the FCM instance', () => {
      expect(afm.deleteToken).toBeDefined();
    });

  });

});
