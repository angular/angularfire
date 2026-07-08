import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FIREBASE_APP_NAME, FIREBASE_OPTIONS } from '@angular/fire/compat';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, AngularFirestoreModule, USE_EMULATOR } from '@angular/fire/compat/firestore';
import { COMMON_CONFIG, firestoreEmulatorPort } from '../../../src/test-config';
import 'firebase/compat/firestore';
import { rando } from '../../../src/utils';

describe('AngularFirestore', () => {
  let afs: AngularFirestore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFirestoreModule.enablePersistence()
      ],
      providers: [
        { provide: USE_EMULATOR, useValue: ['localhost', firestoreEmulatorPort] }
      ]
    });

    afs = TestBed.inject(AngularFirestore);
  });

  it('should be the properly initialized type', () => {
    expect(afs instanceof AngularFirestore).toBe(true);
  });

  it('should have an initialized Firebase app', () => {
    expect(TestBed.runInInjectionContext(() => afs.firestore.app)).toBeDefined();
  });

  it('should create an AngularFirestoreDocument from a string path', () => {
    const doc = TestBed.runInInjectionContext(() => afs.doc('a/doc'));
    expect(doc instanceof AngularFirestoreDocument).toBe(true);
  });

  it('should create an AngularFirestoreDocument from a string path', () => {
    const doc = TestBed.runInInjectionContext(() => afs.doc(afs.doc('a/doc').ref));
    expect(doc instanceof AngularFirestoreDocument).toBe(true);
  });

  it('should create an AngularFirestoreCollection from a string path', () => {
    const collection = TestBed.runInInjectionContext(() => afs.collection('stuffs'));
    expect(collection instanceof AngularFirestoreCollection).toBe(true);
  });

  it('should create an AngularFirestoreCollection from a reference', () => {
    const collection = TestBed.runInInjectionContext(() => afs.collection(afs.collection('stuffs').ref));
    expect(collection instanceof AngularFirestoreCollection).toBe(true);
  });

  it('should throw on an invalid document path', () => {
    const singleWrapper = () => TestBed.runInInjectionContext(() => afs.doc('collection'));
    const tripleWrapper = () => TestBed.runInInjectionContext(() => afs.doc('collection/doc/subcollection'));
    expect(singleWrapper).toThrowError();
    expect(tripleWrapper).toThrowError();
  });

  it('should throw on an invalid collection path', () => {
    const singleWrapper = () => TestBed.runInInjectionContext(() => afs.collection('collection/doc'));
    const quadWrapper = () => TestBed.runInInjectionContext(() => afs.collection('collection/doc/subcollection/doc'));
    expect(singleWrapper).toThrowError();
    expect(quadWrapper).toThrowError();
  });

  if (typeof window === 'undefined') {

    it('should not enable persistence (Node.js)', (done) => {
      TestBed.runInInjectionContext(() => afs.persistenceEnabled$).subscribe(isEnabled => {
        expect(isEnabled).toBe(false);
        done();
      });
    });

  } else {

    it('should enable persistence', (done) => {
      TestBed.runInInjectionContext(() => afs.persistenceEnabled$).subscribe(isEnabled => {
        expect(isEnabled).toBe(true);
        done();
      });
    });

  }

});

describe('AngularFirestore with different app', () => {
  let afs: AngularFirestore;
  let firebaseAppName: string;

  beforeEach(() => {
    firebaseAppName = rando();
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFirestoreModule
      ],
      providers: [
        { provide: FIREBASE_APP_NAME, useValue: firebaseAppName },
        { provide: FIREBASE_OPTIONS, useValue: COMMON_CONFIG },
        { provide: USE_EMULATOR, useValue: ['localhost', firestoreEmulatorPort] }
      ]
    });


    afs = TestBed.inject(AngularFirestore);
  });

  describe('<constructor>', () => {

    it('should be an AngularFirestore type', () => {
      expect(afs instanceof AngularFirestore).toEqual(true);
    });

    it('should have an initialized Firebase app', () => {
      expect(TestBed.runInInjectionContext(() => afs.firestore.app)).toBeDefined();
    });

    it('should have an initialized Firebase app instance member', () => {
      expect(TestBed.runInInjectionContext(() => afs.firestore.app.name)).toEqual(firebaseAppName);
    });
  });

});


describe('AngularFirestore without persistance', () => {
  let afs: AngularFirestore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFirestoreModule
      ],
      providers: [
        { provide: USE_EMULATOR, useValue: ['localhost', firestoreEmulatorPort] }
      ]
    });

    afs = TestBed.inject(AngularFirestore);
  });

  it('should not enable persistence', (done) => {
    TestBed.runInInjectionContext(() => afs.persistenceEnabled$).subscribe(isEnabled => {
      expect(isEnabled).toBe(false);
      done();
    });
  });

});
