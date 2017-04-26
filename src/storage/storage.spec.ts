import * as firebase from 'firebase/app';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from '../angularfire2';
import { AngularFireStorage } from './storage';
import { AngularFireStorageModule } from './storage.module';
import { COMMON_CONFIG } from '../test-config';


describe('AngularFireStorage', () => {
  let app: firebase.app.App;
  let storage: AngularFireStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireStorageModule
      ]
    });
    inject([FirebaseApp, AngularFireStorage], (app_: FirebaseApp, _storage: AngularFireStorage) => {
      app = app_;
      storage = _storage;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  it('should be exist', () => {
    expect(storage instanceof AngularFireStorage).toBe(true);
  });

  it('should have the Firebase Auth instance', () => {
    expect(storage.storage).toBeDefined();
  });

});

