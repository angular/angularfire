import { Observable, forkJoin } from 'rxjs'
import { map, mergeMap, tap } from 'rxjs/operators';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FIREBASE_OPTIONS, AngularFireModule, FIREBASE_APP_NAME } from '@angular/fire';
import { AngularFireStorageModule, AngularFireStorage, AngularFireUploadTask, BUCKET } from './public_api';
import { COMMON_CONFIG } from '../test-config';
import 'firebase/storage';
import { rando } from '../firestore/utils.spec';

describe('AngularFireStorage', () => {
  let app: FirebaseApp;
  let afStorage: AngularFireStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireStorageModule
      ]
    });
    inject([FirebaseApp, AngularFireStorage], (app_: FirebaseApp, _storage: AngularFireStorage) => {
      app = app_;
      afStorage = _storage;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  it('should exist', () => {
    expect(afStorage instanceof AngularFireStorage).toBe(true);
  });

  it('should have the Firebase storage instance', () => {
    expect(afStorage.storage).toBeDefined();
  });

  it('should have an initialized Firebase app', () => {
    expect(afStorage.storage.app).toBeDefined();
  });

  // TODO tests for node?
  if (typeof Blob !== 'undefined') {

    describe('upload task', () => {

      it('should upload and delete a file', (done) => {
        const data = { angular: "fire" };
        const blob = new Blob([JSON.stringify(data)], { type : 'application/json' });
        const ref = afStorage.ref('af.json');
        const task = ref.put(blob);
        const sub = task.snapshotChanges()
          .subscribe(
            snap => { expect(snap).toBeDefined() },
            e => { done.fail(); },
            () => {
              ref.delete().subscribe(done, done.fail);
            });
      });

      it('should upload a file and observe the download url', (done) => {
        const data = { angular: "fire" };
        const blob = new Blob([JSON.stringify(data)], { type : 'application/json' });
        const ref = afStorage.ref('af.json');
        const task = ref.put(blob).then(() => {;
          const url$ = ref.getDownloadURL();
          url$.subscribe(
            url => { expect(url).toBeDefined(); },
            e => { done.fail(); },
            () => { ref.delete().subscribe(done, done.fail); }
          );
        });
      });

      it('should resolve the task as a promise', (done) => {
        const data = { angular: "promise" };
        const blob = new Blob([JSON.stringify(data)], { type : 'application/json' });
        const ref = afStorage.ref('af.json');
        const task: AngularFireUploadTask = ref.put(blob);
        task.then(snap => { 
          expect(snap).toBeDefined(); 
          done();
        }).catch(done.fail);
      });

    });

    describe('reference', () => {

      it('it should upload, download, and delete', (done) => {
        const data = { angular: "fire" };
        const blob = new Blob([JSON.stringify(data)], { type : 'application/json' });
        const ref = afStorage.ref('af.json');
        const task = ref.put(blob);
        // Wait for the upload
        const sub = forkJoin(task.snapshotChanges())
          .pipe(
            // get the url download
            mergeMap(() => ref.getDownloadURL()),
            // assert the URL
            tap(url => expect(url).toBeDefined()),
            // Delete the file
            mergeMap(url => ref.delete())
          )
          // finish the test
          .subscribe(done, done.fail);
      });

      it('should upload, get metadata, and delete', (done) => {
        const data = { angular: "fire" };
        const blob = new Blob([JSON.stringify(data)], { type : 'application/json' });
        const ref = afStorage.ref('af.json');
        const task = ref.put(blob, { customMetadata: { blah: 'blah' } });
        // Wait for the upload
        const sub = forkJoin(task.snapshotChanges())
          .pipe(
            // get the metadata download
            mergeMap(() => ref.getMetadata()),
            // assert the URL
            tap(meta => expect(meta.customMetadata).toEqual({ blah: 'blah' })),
            // Delete the file
            mergeMap(meta => ref.delete())
          )
          // finish the test
          .subscribe(done, done.fail);
      });

    });

  }

});

describe('AngularFireStorage w/options', () => {
  let app: FirebaseApp;
  let afStorage: AngularFireStorage;
  let firebaseAppName: string;
  let storageBucket: string;

  beforeEach(() => {
    firebaseAppName = rando();
    storageBucket = 'angularfire2-test2';
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireStorageModule
      ],
      providers: [
        { provide: FIREBASE_APP_NAME, useValue: firebaseAppName },
        { provide: FIREBASE_OPTIONS, useValue:  COMMON_CONFIG },
        { provide: BUCKET, useValue: storageBucket }
      ]
    });
    inject([FirebaseApp, AngularFireStorage], (app_: FirebaseApp, _storage: AngularFireStorage) => {
      app = app_;
      afStorage = _storage;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  describe('<constructor>', () => {
   
    it('should exist', () => {
      expect(afStorage instanceof AngularFireStorage).toBe(true);
    });

    it('should have the Firebase storage instance', () => {
      expect(afStorage.storage).toBeDefined();
    });

    it('should have an initialized Firebase app', () => {
      expect(afStorage.storage.app).toBeDefined();
    });

    it('should be hooked up the right app', () => {
      expect(afStorage.storage.app.name).toEqual(firebaseAppName);
    });

    it('storage be pointing towards a different bucket', () => {
      expect(afStorage.storage.ref().toString()).toEqual( `gs://${storageBucket}/`);
    });

    // TODO tests for Node?
    if (typeof Blob !== 'undefined') {

      it('it should upload, download, and delete', (done) => {
        const data = { angular: "fire" };
        const blob = new Blob([JSON.stringify(data)], { type : 'application/json' });
        const ref = afStorage.ref('af.json');
        const task = ref.put(blob);
        // Wait for the upload
        const sub = forkJoin(task.snapshotChanges())
          .pipe(
            // get the url download
            mergeMap(() => ref.getDownloadURL()),
            // assert the URL
            tap(url => expect(url).toMatch(new RegExp(`https:\\/\\/firebasestorage\\.googleapis\\.com\\/v0\\/b\\/${storageBucket}\\/o\\/af\\.json`))),
            // Delete the file
            mergeMap(url => ref.delete())
          )
          // finish the test
          .subscribe(done, done.fail);
      });

    }

  });

});
