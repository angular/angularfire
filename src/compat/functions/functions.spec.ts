import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FIREBASE_APP_NAME, FIREBASE_OPTIONS } from '@angular/fire/compat';
import { AngularFireFunctions, AngularFireFunctionsModule, REGION, USE_EMULATOR } from '@angular/fire/compat/functions';
import { COMMON_CONFIG } from '../../../src/test-config';
import 'firebase/compat/functions';
import { rando } from '../../../src/utils';

describe('AngularFireFunctions', () => {
  let afFns: AngularFireFunctions;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireFunctionsModule
      ],
      providers: [
        { provide: USE_EMULATOR, useValue: ['localhost', 9999] },
        { provide: REGION, useValue: 'us-central1' },
      ]
    });

    afFns = TestBed.inject(AngularFireFunctions);
  });

  it('should exist', () => {
    expect(afFns instanceof AngularFireFunctions).toBe(true);
  });

  it('should have the Firebase Functions instance', () => {
    expect(afFns.useFunctionsEmulator).toBeDefined();
  });

});

describe('AngularFireFunctions with different app', () => {
  let afFns: AngularFireFunctions;
  let firebaseAppName: string;

  beforeEach(() => {
    firebaseAppName = rando();
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireFunctionsModule
      ],
      providers: [
        { provide: FIREBASE_APP_NAME, useValue: firebaseAppName },
        { provide: FIREBASE_OPTIONS, useValue: COMMON_CONFIG },
        { provide: USE_EMULATOR, useValue: ['localhost', 9999] },
        { provide: REGION, useValue: 'us-central1' },
      ]
    });

    afFns = TestBed.inject(AngularFireFunctions);
  });

  describe('<constructor>', () => {

    it('should be an AngularFireAuth type', () => {
      expect(afFns instanceof AngularFireFunctions).toEqual(true);
    });

    it('should have the Firebase Functions instance', () => {
      expect(afFns.useFunctionsEmulator).toBeDefined();
    });

  });

});
