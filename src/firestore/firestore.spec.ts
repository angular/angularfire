import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFirestore } from './firestore';
import { AngularFirestoreModule } from './firestore.module';
import { AngularFirestoreDocument } from './document/document';
import { AngularFirestoreCollection } from './collection/collection';

import { FirebaseApp as FBApp } from '@firebase/app-types';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from './test-config';

interface Stock {
  name: string;
  price: number;
}

describe('AngularFirestore', () => {
  let app: FBApp;
  let afs: AngularFirestore;
  let sub: Subscription;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFirestoreModule.enablePersistence()
      ]
    });
    inject([FirebaseApp, AngularFirestore], (_app: FBApp, _afs: AngularFirestore) => {
      app = _app;
      afs = _afs;
    })();
  });

  afterEach(async (done) => {
    await app.delete();
    done();
  });

  it('should be the properly initialized type', () => {
    expect(afs instanceof AngularFirestore).toBe(true);
  });

  it('should have an initialized Firebase app', () => {
    expect(afs.app).toBeDefined();
  });

  it('should create an AngularFirestoreDocument', () => {
    const doc = afs.doc('a/doc');
    expect(doc instanceof AngularFirestoreDocument).toBe(true);
  });

  it('should create an AngularFirestoreCollection', () => {
    const collection = afs.collection('stuffs');
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

  it('should enable persistence', (done) => {
    const sub = afs.persistenceEnabled$.subscribe(isEnabled => {
      expect(isEnabled).toBe(true);
      done();
    });
  });

});
