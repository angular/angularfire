import { forkJoin, from } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FIREBASE_APP_NAME, FIREBASE_OPTIONS, FirebaseApp } from '@angular/fire';
import { AngularFireStorage, AngularFireStorageModule, AngularFireUploadTask, BUCKET } from './public_api';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../firestore/utils.spec';
import { GetDownloadURLPipe } from './pipes/storageUrl.pipe';
import { ChangeDetectorRef } from '@angular/core';
import 'firebase/storage';

if (typeof XMLHttpRequest === 'undefined') {
  globalThis.XMLHttpRequest = require('xhr2');
}

const blobOrBuffer = (data: string, options: {}) => {
  if (typeof Blob === 'undefined') {
    return Buffer.from(data, 'utf8');
  } else {
    return new Blob([JSON.stringify(data)], options);
  }
};

describe('AngularFireLazyStorage', () => {
  let app: FirebaseApp;
  let afStorage: AngularFireStorage;
  let cdr: ChangeDetectorRef;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireStorageModule,
      ],
      providers: [
        ChangeDetectorRef
      ]
    });

    app = TestBed.inject(FirebaseApp);
    afStorage = TestBed.inject(AngularFireStorage);
    cdr = TestBed.inject(ChangeDetectorRef);
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

  describe('upload task', () => {

    it('should upload and delete a file', (done) => {
      const data = { angular: 'fire' };
      const blob = blobOrBuffer(JSON.stringify(data), { type: 'application/json' });
      const ref = afStorage.ref('af.json');
      const task = ref.put(blob);
      task.snapshotChanges()
        .subscribe(
          snap => {
            expect(snap).toBeDefined();
          },
          done.fail,
          () => {
            ref.delete().subscribe(done, done.fail);
          });
    });

    it('should upload a file and observe the download url', (done) => {
      const data = { angular: 'fire' };
      const blob = blobOrBuffer(JSON.stringify(data), { type: 'application/json' });
      const ref = afStorage.ref('af.json');
      ref.put(blob).then(() => {
        const url$ = ref.getDownloadURL();
        url$.subscribe(
          url => {
            expect(url).toBeDefined();
          },
          done.fail,
          () => {
            ref.delete().subscribe(done, done.fail);
          }
        );
      });
    });

    it('should resolve the task as a promise', (done) => {
      const data = { angular: 'promise' };
      const blob = blobOrBuffer(JSON.stringify(data), { type: 'application/json' });
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
      const data = { angular: 'fire' };
      const blob = blobOrBuffer(JSON.stringify(data), { type: 'application/json' });
      const ref = afStorage.ref('af.json');
      const task = ref.put(blob);
      // Wait for the upload
      forkJoin([task.snapshotChanges()])
        .pipe(
          // get the url download
          mergeMap(() => ref.getDownloadURL()),
          // assert the URL
          tap(url => expect(url).toBeDefined()),
          // Delete the file
          mergeMap(() => ref.delete())
        )
        // finish the test
        .subscribe(done, done.fail);
    });

    it('should upload, get metadata, and delete', (done) => {
      const data = { angular: 'fire' };
      const blob = blobOrBuffer(JSON.stringify(data), { type: 'application/json' });
      const ref = afStorage.ref('af.json');
      const task = ref.put(blob, { customMetadata: { blah: 'blah' } });
      // Wait for the upload
      forkJoin([task.snapshotChanges()])
        .pipe(
          // get the metadata download
          mergeMap(() => ref.getMetadata()),
          // assert the URL
          tap(meta => expect(meta.customMetadata).toEqual({ blah: 'blah' })),
          // Delete the file
          mergeMap(() => ref.delete())
        )
        // finish the test
        .subscribe(done, done.fail);
    });

  });

});

describe('AngularFireLazyStorage w/options', () => {
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
        { provide: FIREBASE_OPTIONS, useValue: COMMON_CONFIG },
        { provide: BUCKET, useValue: storageBucket }
      ]
    });

    app = TestBed.inject(FirebaseApp);
    afStorage = TestBed.inject(AngularFireStorage);
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
      expect(afStorage.storage.ref().toString()).toEqual(`gs://${storageBucket}/`);
    });

    // TODO tests for Node?
    if (typeof Blob !== 'undefined') {

      it('it should upload, download, and delete', (done) => {
        const data = { angular: 'fire' };
        const blob = blobOrBuffer(JSON.stringify(data), { type: 'application/json' });
        const ref = afStorage.ref('af.json');
        const task = ref.put(blob);
        // Wait for the upload
        forkJoin([task.snapshotChanges()])
          .pipe(
            // get the url download
            mergeMap(() => ref.getDownloadURL()),
            // assert the URL
            tap(url => expect(url).toMatch(new RegExp(`https:\\/\\/firebasestorage\\.googleapis\\.com\\/v0\\/b\\/${storageBucket}\\/o\\/af\\.json`))),
            // Delete the file
            mergeMap(() => ref.delete())
          )
          // finish the test
          .subscribe(done, done.fail);
      });

    }

  });

});
