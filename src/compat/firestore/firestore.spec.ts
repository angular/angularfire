import { AngularFireModule, FIREBASE_APP_NAME, FIREBASE_OPTIONS, FirebaseApp } from '@angular/fire/compat';
import { AngularFirestore, SETTINGS, AngularFirestoreModule, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/compat/firestore';

import { TestBed } from '@angular/core/testing';
import { COMMON_CONFIG } from '../../test-config';
import 'firebase/compat/firestore';
import { rando } from '../../utils';

describe('AngularFirestore', () => {
  let app: FirebaseApp;
  let afs: AngularFirestore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFirestoreModule.enablePersistence()
      ],
      providers: [
        { provide: SETTINGS, useValue: { host: 'localhost:8080', ssl: false } }
      ]
    });

    app = TestBed.inject(FirebaseApp);
    afs = TestBed.inject(AngularFirestore);
  });

  afterEach(() => {
    app.delete().catch();
  });

  it('should be the properly initialized type', () => {
    expect(afs instanceof AngularFirestore).toBe(true);
  });

  it('should have an initialized Firebase app', () => {
    expect(afs.firestore.app).toBeDefined();
  });

  it('should create an AngularFirestoreDocument from a string path', () => {
    const doc = afs.doc('a/doc');
    expect(doc instanceof AngularFirestoreDocument).toBe(true);
  });

  it('should create an AngularFirestoreDocument from a string path', () => {
    const doc = afs.doc(afs.doc('a/doc').ref);
    expect(doc instanceof AngularFirestoreDocument).toBe(true);
  });

  it('should create an AngularFirestoreCollection from a string path', () => {
    const collection = afs.collection('stuffs');
    expect(collection instanceof AngularFirestoreCollection).toBe(true);
  });

  it('should create an AngularFirestoreCollection from a reference', () => {
    const collection = afs.collection(afs.collection('stuffs').ref);
    expect(collection instanceof AngularFirestoreCollection).toBe(true);
  });

  it('should throw on an invalid document path', () => {
    const singleWrapper = () => afs.doc('collection');
    const tripleWrapper = () => afs.doc('collection/doc/subcollection');
    expect(singleWrapper).toThrowError();
    expect(tripleWrapper).toThrowError();
  });

  it('should throw on an invalid collection path', () => {
    const singleWrapper = () => afs.collection('collection/doc');
    const quadWrapper = () => afs.collection('collection/doc/subcollection/doc');
    expect(singleWrapper).toThrowError();
    expect(quadWrapper).toThrowError();
  });

  if (typeof window === 'undefined') {

    it('should not enable persistence (Node.js)', (done) => {
      afs.persistenceEnabled$.subscribe(isEnabled => {
        expect(isEnabled).toBe(false);
        done();
      });
    });

  } else {

    it('should enable persistence', (done) => {
      afs.persistenceEnabled$.subscribe(isEnabled => {
        expect(isEnabled).toBe(true);
        done();
      });
    });

  }

});

describe('AngularFirestore with different app', () => {
  let app: FirebaseApp;
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
        { provide: SETTINGS, useValue: { host: 'localhost:8080', ssl: false } }
      ]
    });


    app = TestBed.inject(FirebaseApp);
    afs = TestBed.inject(AngularFirestore);
  });

  afterEach(() => {
    app.delete().catch();
  });

  describe('<constructor>', () => {

    it('should be an AngularFirestore type', () => {
      expect(afs instanceof AngularFirestore).toEqual(true);
    });

    it('should have an initialized Firebase app', () => {
      expect(afs.firestore.app).toBeDefined();
    });

    it('should have an initialized Firebase app instance member', () => {
      expect(afs.firestore.app.name).toEqual(firebaseAppName);
    });
  });

});


describe('AngularFirestore without persistance', () => {
  let app: FirebaseApp;
  let afs: AngularFirestore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFirestoreModule
      ],
      providers: [
        { provide: SETTINGS, useValue: { host: 'localhost:8080', ssl: false } }
      ]
    });

    app = TestBed.inject(FirebaseApp);
    afs = TestBed.inject(AngularFirestore);
  });

  afterEach(() => {
    app.delete().catch();
  });

  it('should not enable persistence', (done) => {
    afs.persistenceEnabled$.subscribe(isEnabled => {
      expect(isEnabled).toBe(false);
      done();
    });
  });

});
