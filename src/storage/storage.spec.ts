import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable'
import { forkJoin } from 'rxjs/observable/forkJoin';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireStorageModule, AngularFireStorage } from 'angularfire2/storage';
import { COMMON_CONFIG } from './test-config';

describe('AngularFireStorage', () => {
  let app: firebase.app.App;
  let afStorage: AngularFireStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireStorageModule
      ]
    });
    inject([FirebaseApp, AngularFireStorage], (app_: FirebaseApp, _storage: AngularFireStorage) => {
      app = app_;
      afStorage = _storage;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  it('should exist', () => {
    expect(afStorage instanceof AngularFireStorage).toBe(true);
  });

  it('should have the Firebase storage instance', () => {
    expect(afStorage.storage).toBeDefined();
  });

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
      const ref = afStorage.ref('afs.json');
      const task = ref.put(blob);
      const url$ = task.downloadURL();
      url$.subscribe(
        url => { console.log(url); expect(url).toBeDefined(); },
        e => { done.fail(); },
        () => { ref.delete().subscribe(done, done.fail); }
      );
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
        // get the url download
        .mergeMap(() => ref.getDownloadURL())
        // assert the URL
        .do(url => expect(url).toBeDefined())
        // Delete the file
        .mergeMap(url => ref.delete())
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
        // get the metadata download
        .mergeMap(() => ref.getMetadata())
        // assert the URL
        .do(meta => expect(meta.customMetadata).toEqual({ blah: 'blah' }))
        // Delete the file
        .mergeMap(meta => ref.delete())
        // finish the test
        .subscribe(done, done.fail);
    });

  });

});
