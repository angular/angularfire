import { AngularFireModule, FIREBASE_APP_NAME, FIREBASE_OPTIONS, FirebaseApp } from '@angular/fire';
import { AngularFirestore, SETTINGS } from './firestore';
import { AngularFirestoreModule } from './firestore.module';
import { AngularFirestoreDocument } from './document/document';
import { AngularFirestoreCollection } from './collection/collection';

import { Subscription } from 'rxjs';

import { inject, TestBed } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';
import 'firebase/firestore';
import { rando } from './utils.spec';

interface Stock {
  name: string;
  price: number;
}

describe('AngularFirestore', () => {
  let app: FirebaseApp;
  let afs: AngularFirestore;
  let sub: Subscription;

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
    inject([FirebaseApp, AngularFirestore], (_app: FirebaseApp, _afs: AngularFirestore) => {
      app = _app;
      afs = _afs;
    })();
  });

  afterEach(() => {
    app.delete();
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
    const ref = afs.doc('a/doc').ref;
    const doc = afs.doc(ref);
    expect(doc instanceof AngularFirestoreDocument).toBe(true);
  });

  it('should create an AngularFirestoreCollection from a string path', () => {
    const collection = afs.collection('stuffs');
    expect(collection instanceof AngularFirestoreCollection).toBe(true);
  });

  it('should create an AngularFirestoreCollection from a reference', () => {
    const ref = afs.collection('stuffs').ref;
    const collection = afs.collection(ref);
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

  if (typeof window == 'undefined') {

    it('should not enable persistence (Node.js)', (done) => {
      const sub = afs.persistenceEnabled$.subscribe(isEnabled => {
        expect(isEnabled).toBe(false);
        done();
      });
    });

  } else {

    it('should enable persistence', (done) => {
      const sub = afs.persistenceEnabled$.subscribe(isEnabled => {
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
    inject([FirebaseApp, AngularFirestore], (app_: FirebaseApp, _afs: AngularFirestore) => {
      app = app_;
      afs = _afs;
    })();
  });

  afterEach(() => {
    app.delete();
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
    inject([FirebaseApp, AngularFirestore], (_app: FirebaseApp, _afs: AngularFirestore) => {
      app = _app;
      afs = _afs;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  it('should not enable persistence', (done) => {
    afs.persistenceEnabled$.subscribe(isEnabled => {
      expect(isEnabled).toBe(false);
      done();
    });
  });

});
