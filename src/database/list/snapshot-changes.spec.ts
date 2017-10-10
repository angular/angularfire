import * as firebase from 'firebase/app';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule, snapshotChanges, ChildEvent } from 'angularfire2/database';
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
      app.database().goOnline();
      createRef = (path: string) => { app.database().goOnline(); return app.database().ref(path); };
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  function prepareSnapshotChanges(opts: { events?: ChildEvent[], skip: number } = { skip: 0 }) {
    const { events, skip } = opts;
    const aref = createRef(rando());
    aref.set(batch);
    const snapChanges = snapshotChanges(aref, events);
    return {
      snapChanges: snapChanges.skip(skip),
      ref: aref 
    };
  }

  it('should listen to all events by default', (done) => {
    const { snapChanges } = prepareSnapshotChanges({ skip: 0 });
    const sub = snapChanges.subscribe(actions => {
      const data = actions.map(a => a.payload!.val());
      expect(data).toEqual(items);
      done();
      sub.unsubscribe();
    });
  });

  it('should handle an empty set', (done) => {
    const aref = app.database().ref(rando());
    const snapChanges = snapshotChanges(aref, []);
    const sub = snapChanges.subscribe(actions => {
      const data = actions.map(a => a.payload!.val());
      expect(data.length).toEqual(0);
      done();
      sub.unsubscribe();
    });
  });

 it('should listen to only child_added events', (done) => {
    const { snapChanges } = prepareSnapshotChanges({ events: ['child_added'], skip: 0 });
    const sub = snapChanges.subscribe(actions => {
      const data = actions.map(a => a.payload!.val());
      expect(data).toEqual(items);
      done();
      sub.unsubscribe();
    });
  });

  it('should listen to only child_added, child_changed events', (done) => {
    const { snapChanges, ref } = prepareSnapshotChanges({ 
      events: ['child_added', 'child_changed'], 
      skip: 0
    });
    const name = 'ligatures';
    const sub = snapChanges.subscribe(actions => {
      const data = actions.map(a => a.payload!.val());;
      const copy = [...items];
      copy[0].name = name;
      expect(data).toEqual(copy);
      done();
      sub.unsubscribe();
    });
    ref.child(items[0].key).update({ name });
  });  

});
