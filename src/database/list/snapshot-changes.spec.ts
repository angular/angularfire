import * as firebase from 'firebase/app';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule, snapshotChanges, ChildEvent } from 'angularfire2/database';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';
import 'rxjs/add/operator/skip';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

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
    const snapChanges = snapshotChanges(aref, events);
    return {
      snapChanges: snapChanges.skip(skip),
      ref: aref 
    };
  }

  it('should listen to all events by default', (done) => {
    const { snapChanges, ref } = prepareSnapshotChanges({ skip: 2 });
    const sub = snapChanges.subscribe(actions => {
      const data = actions.map(a => a.payload!.val());
      expect(data).toEqual(items);
      done();
      sub.unsubscribe();
    });
    ref.set(batch);
  });

  it('should handle multiple subscriptions (hot)', (done) => {
    const { snapChanges, ref } = prepareSnapshotChanges({ skip: 2 });
    const sub = snapChanges.subscribe(() => {}).add(
      snapChanges.take(1).subscribe(actions => {
        const data = actions.map(a => a.payload!.val());
        expect(data).toEqual(items);
      })
    ).add(done);
    ref.set(batch);
  });

  it('should handle multiple subscriptions (warm)', async (done: any) => {
    const { snapChanges, ref } = prepareSnapshotChanges({ skip: 2 });
    snapChanges.take(1).subscribe(() => {}).add(() => {
      const sub = snapChanges.take(1).subscribe(actions => {
        const data = actions.map(a => a.payload!.val());
        expect(data).toEqual(items);
      }).add(done);
    });
    ref.set(batch);
  });

 it('should listen to only child_added events', (done) => {
    const { snapChanges, ref } = prepareSnapshotChanges({ events: ['child_added'], skip: 2 });
    const sub = snapChanges.subscribe(actions => {
      const data = actions.map(a => a.payload!.val());
      expect(data).toEqual(items);
      done();
      sub.unsubscribe();
    });
    ref.set(batch);
  });

  it('should listen to only child_added, child_changed events', (done) => {
    const { snapChanges, ref } = prepareSnapshotChanges({ 
      events: ['child_added', 'child_changed'], 
      skip: 3
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
    ref.set(batch).then(() => {
      ref.child(items[0].key).update({ name });
    })
  });
  
  it('should handle empty sets', async (done) => {
    const aref = createRef(rando());
    const sub = snapshotChanges(aref).take(1).subscribe(data => {
      expect(data.length).toEqual(0);
    }).add(done);
  });

  it('should handle dynamic queries that return empty sets', async (done) => {
    const ITEMS = 10;
    let count = 0;
    let firstIndex = 0;
    let namefilter$ = new BehaviorSubject<number|null>(null);
    const aref = createRef(rando());
    await aref.set(batch);
    const sub = namefilter$.switchMap(name => {
      const filteredRef = name ? aref.child('name').equalTo(name) : aref
      return snapshotChanges(filteredRef);
    }).skip(2).subscribe(data => {
      count = count + 1;
      // the first time should all be 'added'
      if(count === 1) {
        expect(Object.keys(data).length).toEqual(3);
        namefilter$.next(-1);
      }
      // on the second round, we should have filtered out everything
      if(count === 2) {
        expect(Object.keys(data).length).toEqual(0);
        sub.unsubscribe();
      }
    }).add(done);
  });

});
