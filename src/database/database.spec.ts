import { FirebaseApp, FirebaseAppConfig, AngularFireModule, FirebaseAppName } from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule, RealtimeDatabaseURL } from 'angularfire2/database';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from './test-config';
import { NgZone, ApplicationRef } from '@angular/core';
import { TransferState } from '@angular/platform-browser';

// generate random string to test fidelity of naming
const FIREBASE_APP_NAME = (Math.random() + 1).toString(36).substring(7);

describe('AngularFireDatabase', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;
  let zone: NgZone
  let ts: TransferState
  let appRef: ApplicationRef

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, FIREBASE_APP_NAME),
        AngularFireDatabaseModule
      ]
    });
    inject([FirebaseApp, AngularFireDatabase, NgZone, TransferState, ApplicationRef], 
      (app_: FirebaseApp, _db: AngularFireDatabase, _zone: NgZone, _ts: TransferState, _appRef: ApplicationRef) => {
      app = app_;
      db = _db;
      zone = _zone;
      ts = _ts;
      appRef = _appRef
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
      expect(db.database.app).toEqual(app);
    });

    it('should accept a Firebase App in the constructor', () => {
      const __db = new AngularFireDatabase(app.options, app.name, null!, 'RTDB', ts, appRef, zone);
      expect(__db instanceof AngularFireDatabase).toEqual(true);
    });

    it('should have an initialized Firebase app instance member', () => {
      expect(db.database.app.name).toEqual(FIREBASE_APP_NAME);
    });

  });

});

const FIREBASE_APP_NAME_TOO = (Math.random() + 1).toString(36).substring(7);
const FIREBASE_DB_NAME = `https://angularfire2-test2.firebaseio.com/`;
const QUERY = (Math.random() + 1).toString(36).substring(7)

describe('AngularFireDatabase w/options', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, FIREBASE_APP_NAME),
        AngularFireDatabaseModule
      ],
      providers: [
        { provide: FirebaseAppName, useValue: FIREBASE_APP_NAME_TOO },
        { provide: FirebaseAppConfig, useValue:  COMMON_CONFIG },
        { provide: RealtimeDatabaseURL, useValue: FIREBASE_DB_NAME }
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
      expect(db.database.app).toEqual(app);
    });

    it('should have an initialized Firebase app instance member', () => {
      expect(db.database.app.name).toEqual(FIREBASE_APP_NAME_TOO);
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
