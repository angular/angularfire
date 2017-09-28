import * as firebase from 'firebase/app';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule, listChanges } from 'angularfire2/database';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';
import 'rxjs/add/operator/skip';

// generate random string to test fidelity of naming
const rando = () => (Math.random() + 1).toString(36).substring(7);
const FIREBASE_APP_NAME = rando();

describe('listChanges', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;
  let ref: (path: string) => firebase.database.Reference;
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
      ref = (path: string) => { app.database().goOffline(); return app.database().ref(path); };
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  describe('events', () => {
    
    it('should stream child_added events', (done) => {
      const someRef = ref(rando());
      someRef.set(batch);
      const obs = listChanges(someRef, ['child_added']);
      const sub = obs.skip(2).subscribe(changes => {
        const data = changes.map(change => change.payload!.val());
        expect(data).toEqual(items);
        done();
      });
    });

    it('should process a new child_added event', (done) => {
      const aref = ref(rando());
      aref.set(batch);
      const obs = listChanges(aref, ['child_added']);
      const sub = obs.skip(3).subscribe(changes => {
        const data = changes.map(change => change.payload!.val());
        expect(data[3]).toEqual({ name: 'anotha one' });
        done();
      });
      aref.push({ name: 'anotha one' });
    });

    it('should process a new child_removed event', (done) => {
      const aref = ref(rando());
      aref.set(batch);
      const obs = listChanges(aref, ['child_added','child_removed'])

      const sub = obs.skip(3).subscribe(changes => {
        const data = changes.map(change => change.payload!.val());
        expect(data.length).toEqual(items.length - 1);
        done();
      });
      const childR = aref.child(items[0].key);
      childR.remove().then(console.log);
    });

    it('should process a new child_changed event', (done) => {
      const aref = ref(rando());
      aref.set(batch);
      const obs = listChanges(aref, ['child_added','child_changed'])
      const sub = obs.skip(3).subscribe(changes => {
        const data = changes.map(change => change.payload!.val());
        expect(data[0].name).toEqual('lol');
        done();
      });
      const childR = aref.child(items[0].key);
      childR.update({ name: 'lol'});
    });

    it('should process a new child_moved event', (done) => {
      const aref = ref(rando());
      aref.set(batch);
      const obs = listChanges(aref, ['child_added','child_moved'])
      const sub = obs.skip(3).subscribe(changes => {
        const data = changes.map(change => change.payload!.val());
        // We moved the first item to the last item, so we check that
        // the new result is now the last result
        expect(data[data.length - 1]).toEqual(items[0]);
        done();
      });
      const childR = aref.child(items[0].key);
      childR.setPriority('a', () => {});
    });    
    
  });

});
