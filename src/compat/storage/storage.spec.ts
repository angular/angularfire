import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AngularFireModule, FIREBASE_APP_NAME, FIREBASE_OPTIONS } from '@angular/fire/compat';
import { AngularFireStorage, AngularFireStorageModule, AngularFireUploadTask, BUCKET, USE_EMULATOR, fromTask } from '@angular/fire/compat/storage';
import firebase from 'firebase/compat/app';
import { forkJoin } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { COMMON_CONFIG, storageEmulatorPort } from '../../test-config';
import { rando } from '../../utils';
import 'firebase/compat/storage';

if (typeof XMLHttpRequest === 'undefined') {
  globalThis.XMLHttpRequest = require('xhr2');
}

const blobOrBuffer = (data: string, options: unknown) => {
  if (typeof Blob === 'undefined') {
    return Buffer.from(data, 'utf8');
  } else {
    return new Blob([JSON.stringify(data)], options);
  }
};

describe('AngularFireStorage', () => {
  let afStorage: AngularFireStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireStorageModule,
      ],
      providers: [
        ChangeDetectorRef,
        { provide: USE_EMULATOR, useValue: ['localhost', storageEmulatorPort] }
      ]
    });

    afStorage = TestBed.inject(AngularFireStorage);
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
      const ref = TestBed.runInInjectionContext(() => afStorage.ref(rando()));
      const task = TestBed.runInInjectionContext(() => ref.put(blob));
      let emissionCount = 0;
      let lastSnap: firebase.storage.UploadTaskSnapshot;
      TestBed.runInInjectionContext(() => task.snapshotChanges())
        .subscribe(
          snap => {
            lastSnap = snap;
            emissionCount++;
            expect(snap).toBeDefined();
          },
          done.fail,
          () => {
            expect(lastSnap.state).toBe('success');
            expect(emissionCount).toBeGreaterThan(0);
            ref.delete().subscribe(done, done.fail);
          });
    });

    it('should upload a file and observe the download url', (done) => {
      const data = {angular: 'fire'};
      const blob = blobOrBuffer(JSON.stringify(data), {type: 'application/json'});
      const ref = TestBed.runInInjectionContext(() => afStorage.ref(rando()));
      TestBed.runInInjectionContext(() => ref.put(blob)).then(() => {
        const url$ = TestBed.runInInjectionContext(() => ref.getDownloadURL());
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
      const ref = TestBed.runInInjectionContext(() => afStorage.ref(rando()));
      const task: AngularFireUploadTask = TestBed.runInInjectionContext(() => ref.put(blob));
      task.then(snap => {
        expect(snap).toBeDefined();
        done();
      }).catch(done.fail);
    });

    it('should cancel the task', (done) => {
      const data = { angular: 'promise' };
      const blob = blobOrBuffer(JSON.stringify(data), { type: 'application/json' });
      const ref = TestBed.runInInjectionContext(() => afStorage.ref(rando()));
      const task: AngularFireUploadTask = TestBed.runInInjectionContext(() => ref.put(blob));
      let emissionCount = 0;
      let lastSnap: firebase.storage.UploadTaskSnapshot;
      TestBed.runInInjectionContext(() => task.snapshotChanges()).subscribe(snap => {
        emissionCount++;
        lastSnap = snap;
        if (emissionCount === 1) {
          task.cancel();
        }
      }, () => {
        // TODO investigate, this doesn't appear to work...
        // https://github.com/firebase/firebase-js-sdk/issues/4158
        // expect(lastSnap.state).toEqual('canceled');
        expect(emissionCount).toEqual(1);
        expect(lastSnap.state).toEqual('running');
        done();
      }, done.fail);
    });

    it('should be able to pause/resume the task', (done) => {
      const data = { angular: 'promise' };
      const blob = blobOrBuffer(JSON.stringify(data), { type: 'application/json' });
      const ref = TestBed.runInInjectionContext(() => afStorage.ref(rando()));
      const task: AngularFireUploadTask = TestBed.runInInjectionContext(() => ref.put(blob));
      let paused = false;
      task.pause();
      TestBed.runInInjectionContext(() => task.snapshotChanges()).subscribe(snap => {
        if (snap.state === 'paused') {
          paused = true;
          task.resume();
        }
      }, done.fail, () => {
        expect(paused).toBeTruthy();
        done();
      });
    });

    it('should work with an already finished task', (done) => {
      const data = {angular: 'promise'};
      const blob = blobOrBuffer(JSON.stringify(data), {type: 'application/json'});
      const ref = TestBed.runInInjectionContext(() => afStorage.storage.ref(rando()));
      const task = TestBed.runInInjectionContext(() => ref.put(blob));
      let emissionCount = 0;
      let lastSnap: firebase.storage.UploadTaskSnapshot;
      task.then(_snap => {
        fromTask(task).subscribe(
          snap => {
            lastSnap = snap;
            emissionCount++;
            expect(snap).toBeDefined();
          },
          done.fail,
          () => {
            expect(lastSnap.state).toBe('success');
            expect(emissionCount).toBe(1);
            ref.delete().then(done, done.fail);
          });
      });
    });

  });

  describe('reference', () => {

    it('it should upload, download, and delete', (done) => {
      const data = { angular: 'fire' };
      const blob = blobOrBuffer(JSON.stringify(data), { type: 'application/json' });
      const ref = TestBed.runInInjectionContext(() => afStorage.ref(rando()));
      const task = TestBed.runInInjectionContext(() => ref.put(blob));
      // Wait for the upload
      forkJoin([TestBed.runInInjectionContext(() => task.snapshotChanges())])
        .pipe(
          // get the url download
          mergeMap(() => TestBed.runInInjectionContext(() => ref.getDownloadURL())),
          // assert the URL
          tap(url => expect(url).toBeDefined()),
          // Delete the file
          mergeMap(() => ref.delete())
        )
        // finish the test
        .subscribe(done, done.fail);
    });

    it('should upload, get metadata, and delete', (done) => {
      pending("Not sure why this is busted.");
      const data = { angular: 'fire' };
      const blob = blobOrBuffer(JSON.stringify(data), { type: 'application/json' });
      const ref = TestBed.runInInjectionContext(() => afStorage.ref(rando()));
      const task = TestBed.runInInjectionContext(() => ref.put(blob, { customMetadata: { blah: 'blah' } }));
      // Wait for the upload
      forkJoin([TestBed.runInInjectionContext(() => task.snapshotChanges())])
        .pipe(
          // get the metadata download
          mergeMap(() => TestBed.runInInjectionContext(() => ref.getMetadata())),
          // assert the URL
          tap(meta => expect(meta.customMetadata).toEqual({ blah: 'blah' })),
        )
        // finish the test
        .subscribe(done, done.fail);
    });

  });

});

describe('AngularFireStorage w/options', () => {
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
        { provide: BUCKET, useValue: storageBucket },
        { provide: USE_EMULATOR, useValue: ['localhost', storageEmulatorPort] },
      ]
    });

    afStorage = TestBed.inject(AngularFireStorage);
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
        const name = rando();
        const ref = TestBed.runInInjectionContext(() => afStorage.ref(name));
        const task = TestBed.runInInjectionContext(() => ref.put(blob));
        // Wait for the upload
        forkJoin([TestBed.runInInjectionContext(() => task.snapshotChanges())])
          .pipe(
            // get the url download
            mergeMap(() => TestBed.runInInjectionContext(() => ref.getDownloadURL())),
            // assert the URL
            tap(url => expect(url).toMatch(new RegExp(`http:\\/\\/localhost:9199\\/v0\\/b\\/${storageBucket}\\/o\\/${name}`))),
            // Delete the file
            mergeMap(() => ref.delete())
          )
          // finish the test
          .subscribe(done, done.fail);
      });

    }

  });

});
