import { FirebaseApp, AngularFireModule, FIREBASE_OPTIONS, FIREBASE_APP_NAME } from '@angular/fire';
import { AngularFireDatabase, AngularFireDatabaseModule, URL } from './public_api';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';
import { NgZone } from '@angular/core';
import 'firebase/database';

// generate random string to test fidelity of naming
const rando = () => (Math.random() + 1).toString(36).substring(7);
const FIREBASE_DB_NAME = 'http://localhost:9000/';

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
      ]
    });
    inject([FirebaseApp, AngularFireDatabase, NgZone], (app_: FirebaseApp, _db: AngularFireDatabase, _zone: NgZone) => {
      app = app_;
      db = _db;
      zone = _zone;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  describe('<constructor>', () => {

    it('should be an AngularFireDatabase type', () => {
      expect(db instanceof AngularFireDatabase).toEqual(true);
    });

    it('should have an initialized Firebase app', () => {
      expect(db.database.app).toBeDefined();
    });

    it('should accept a Firebase App in the constructor', () => {
      const __db = new AngularFireDatabase(app.options, app.name, undefined!, {}, zone);
      expect(__db instanceof AngularFireDatabase).toEqual(true);
    });

    it('should have an initialized Firebase app instance member', () => {
      expect(db.database.app.name).toEqual(firebaseAppName);
    });

  });

});

const QUERY = (Math.random() + 1).toString(36).substring(7)

describe('AngularFireDatabase w/options', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;
  let firebaseAppName: string;

  beforeEach(() => {
    firebaseAppName = rando();
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, firebaseAppName),
        AngularFireDatabaseModule
      ],
      providers: [
        { provide: FIREBASE_APP_NAME, useValue: firebaseAppName },
        { provide: FIREBASE_OPTIONS, useValue: COMMON_CONFIG }
      ]
    });
    inject([FirebaseApp, AngularFireDatabase], (app_: FirebaseApp, _db: AngularFireDatabase) => {
      app = app_;
      db = _db;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
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

    it('database be pointing to the provided DB instance', () => {
      expect(db.database.ref().toString()).toEqual(FIREBASE_DB_NAME);
    });

    it('list should be using the provided DB instance', () => {
      expect(db.list(QUERY).query.toString()).toEqual(`${FIREBASE_DB_NAME}${QUERY}`);
    });

    it('object should be using the provided DB instance', () => {
      expect(db.object(QUERY).query.toString()).toEqual(`${FIREBASE_DB_NAME}${QUERY}`);
    });
  });

});
