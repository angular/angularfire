import { FirebaseApp, AngularFireModule, FIREBASE_OPTIONS, FIREBASE_APP_NAME } from '@angular/fire';
import { AngularFireDatabase, AngularFireDatabaseModule, URL } from './public_api';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';
import { NgZone } from '@angular/core';
import 'firebase/database';
import { rando } from '../firestore/utils.spec';

describe('AngularFireDatabase', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;
  let zone: NgZone
  let firebaseAppName: string;

  beforeEach(() => {
    firebaseAppName = rando();
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, firebaseAppName),
        AngularFireDatabaseModule
      ],
      providers: [
        { provide: URL, useValue: 'http://localhost:9000'}
      ]
    });
    inject([FirebaseApp, AngularFireDatabase, NgZone], (app_: FirebaseApp, _db: AngularFireDatabase, _zone: NgZone) => {
      app = app_;
      db = _db;
      zone = _zone;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  describe('<constructor>', () => {

    it('should be an AngularFireDatabase type', () => {
      expect(db instanceof AngularFireDatabase).toEqual(true);
    });

    it('should have an initialized Firebase app', () => {
      expect(db.database.app).toBeDefined();
    });

    it('should accept a Firebase App in the constructor', (done) => {
      const __db = new AngularFireDatabase(app.options, rando(), undefined!, {}, zone);
      expect(__db instanceof AngularFireDatabase).toEqual(true);
      __db.database.app.delete().then(done, done);
    });

    it('should have an initialized Firebase app instance member', () => {
      expect(db.database.app.name).toEqual(firebaseAppName);
    });

  });

});

describe('AngularFireDatabase w/options', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;
  let firebaseAppName: string;
  let url: string;
  let query: string;

  beforeEach(() => {
    query = rando();
    firebaseAppName = rando();
    url = `http://localhost:${Math.floor(Math.random()*9999)}`;
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireDatabaseModule
      ],
      providers: [
        { provide: FIREBASE_APP_NAME, useValue: firebaseAppName },
        { provide: FIREBASE_OPTIONS, useValue: COMMON_CONFIG },
        { provide: URL, useValue: url }
      ]
    });
    inject([FirebaseApp, AngularFireDatabase], (app_: FirebaseApp, _db: AngularFireDatabase) => {
      app = app_;
      db = _db;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  describe('<constructor>', () => {

    it('should be an AngularFireDatabase type', () => {
      expect(db instanceof AngularFireDatabase).toEqual(true);
    });

    it('should have an initialized Firebase app', () => {
      expect(db.database.app).toBeDefined();
    });

    it('should have an initialized Firebase app instance member', () => {
      expect(db.database.app.name).toEqual(firebaseAppName);
    });

/* INVESTIGATE database(url) does not seem to be working 

    it('database be pointing to the provided DB instance', () => {
      expect(db.database.ref().toString()).toEqual(url);
    });

    it('list should be using the provided DB instance', () => {
      expect(db.list(query).query.toString()).toEqual(`${url}/${query}`);
    });

    it('object should be using the provided DB instance', () => {
      expect(db.object(query).query.toString()).toEqual(`${url}/${query}`);
    });
*/
  });

});
