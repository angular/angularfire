import * as firebase from 'firebase/app';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule, createListSnapshotChanges, ChildEvent } from 'angularfire2/database';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';
import 'rxjs/add/operator/skip';

// generate random string to test fidelity of naming
const rando = () => (Math.random() + 1).toString(36).substring(7);
const FIREBASE_APP_NAME = rando();

describe('snapshotChanges', () => {
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
      app.database().goOffline();
      createRef = (path: string) => { app.database().goOffline(); return app.database().ref(path); };
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  function prepareSnapshotChanges(opts: { events?: ChildEvent[], skip: number } = { skip: 0 }) {
    const { events, skip } = opts;
    const aref = createRef(rando());
    aref.set(batch);
    const snapshotChanges = createListSnapshotChanges(aref);
    return {
      snapshotChanges: snapshotChanges(events).skip(skip),
      ref: aref 
    };
  }

  it('should listen to all events by default', (done) => {
    const { snapshotChanges } = prepareSnapshotChanges({ skip: 2 });
    const sub = snapshotChanges.subscribe(snaps => {
      const data = snaps.map(snap => snap.val())
      expect(data).toEqual(items);
      done();
      sub.unsubscribe();
    });
  });

  it('should listen to only child_added events', (done) => {
    const { snapshotChanges } = prepareSnapshotChanges({ events: ['child_added'], skip: 2 });
    const sub = snapshotChanges.subscribe(snaps => {
      const data = snaps.map(snap => snap.val())
      expect(data).toEqual(items);
      done();
      sub.unsubscribe();
    });
  });

  it('should listen to only child_added, child_changed events', (done) => {
    const {snapshotChanges, ref } = prepareSnapshotChanges({ 
      events: ['child_added', 'child_changed'], 
      skip: 3 
    });
    const name = 'ligatures';
    const sub = snapshotChanges.subscribe(snaps => {
      const data = snaps.map(snap => snap.val());
      const copy = [...items];
      copy[0].name = name;
      expect(data).toEqual(copy);
      done();
      sub.unsubscribe();
    });
    ref.child(items[0].key).update({ name });
  });  

});
