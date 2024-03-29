import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FIREBASE_APP_NAME, FIREBASE_OPTIONS } from '@angular/fire/compat';
import { AngularFireMessaging, AngularFireMessagingModule } from '@angular/fire/compat/messaging';
import { COMMON_CONFIG } from '../../../src/test-config';
import { rando } from '../../../src/utils';

describe('AngularFireMessaging', () => {
  let afm: AngularFireMessaging;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireMessagingModule
      ]
    });

    afm = TestBed.inject(AngularFireMessaging);
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

    afm = TestBed.inject(AngularFireMessaging);
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
