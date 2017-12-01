import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable'
import { forkJoin } from 'rxjs/observable/forkJoin';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireStorageModule, AngularFireStorage } from 'angularfire2/storage';
import { COMMON_CONFIG } from './test-config';

console.log(AngularFireStorageModule);

fdescribe('AngularFireStorage', () => {
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

  });

  describe('reference', () => {

    it('it should upload, download, and delete', (done) => {
      const data = { angular: "fire" };
      const blob = new Blob([JSON.stringify(data)], { type : 'application/json' });
      const ref = afStorage.ref('af.json');
      const task = ref.put(blob);
      const sub = forkJoin(task.snapshotChanges())
        .mergeMap(() => ref.getDownloadURL())
        .do(url => expect(url).toBeDefined())
        .mergeMap(url => ref.delete())
        .subscribe(done, done.fail);
    });

  });

});
