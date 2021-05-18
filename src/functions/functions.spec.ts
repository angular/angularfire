import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FIREBASE_APP_NAME, FIREBASE_OPTIONS, FirebaseApp } from '@angular/fire';
import { AngularFireFunctions, AngularFireFunctionsModule, ORIGIN, REGION } from '@angular/fire/functions';
import { COMMON_CONFIG } from '../test-config';
import 'firebase/functions';
import { rando } from '../firestore/utils.spec';

describe('AngularFireFunctions', () => {
  let app: FirebaseApp;
  let afFns: AngularFireFunctions;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireFunctionsModule
      ]
    });

    app = TestBed.inject(FirebaseApp);
    afFns = TestBed.inject(AngularFireFunctions);
  });

  afterEach(() => {
    app.delete().catch();
  });

  it('should exist', () => {
    expect(afFns instanceof AngularFireFunctions).toBe(true);
  });

  it('should have the Firebase Functions instance', () => {
    expect(afFns.useFunctionsEmulator).toBeDefined();
  });

});

describe('AngularFireFunctions with different app', () => {
  let app: FirebaseApp;
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
        { provide: ORIGIN, useValue: 'http://0.0.0.0:9999' },
        { provide: REGION, useValue: 'asia-northeast1' }
      ]
    });

    app = TestBed.inject(FirebaseApp);
    afFns = TestBed.inject(AngularFireFunctions);
  });

  afterEach(() => {
    app.delete().catch();
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
