import * as firebase from 'firebase/app';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule, createLoadedChanges } from 'angularfire2/database';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';
import 'rxjs/add/operator/skip';

// generate random string to test fidelity of naming
const rando = () => (Math.random() + 1).toString(36).substring(7);
const FIREBASE_APP_NAME = rando();

describe('createLoadedChanges', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;
  let createRef: (path: string) => firebase.database.Reference;
  let batch = {};
  const items = [{ name: 'zero' }, { name: 'one' }, { name: 'two' }].map((item, i) => ( { key: i.toString(), ...item } ));
  Object.keys(items).forEach(function (key, i) {
    const itemValue = items[key];
    batch[i] = itemValue;
  });
  // make batch immutable to preserve integrity
  batch = Object.freeze(batch);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, FIREBASE_APP_NAME),
        AngularFireDatabaseModule
      ]
    });
    inject([FirebaseApp, AngularFireDatabase], (app_: FirebaseApp, _db: AngularFireDatabase) => {
      app = app_;
      db = _db;
      app.database().goOnline();
      createRef = (path: string) => { app.database().goOnline(); return app.database().ref(path); };
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  it('should not emit until the array is whole', (done) => {
    const ref = createRef(rando());
    ref.set(batch);
    createLoadedChanges(ref)().subscribe(snaps => {
      const data = snaps.map(s => s.val());
      expect(data).toEqual(items);
      done();
    });
  });

});
