import firebase from 'firebase/compat/app';
import { AngularFireModule, FirebaseApp } from '@angular/fire';
import { AngularFireDatabase, AngularFireDatabaseModule, ChildEvent, snapshotChanges, URL } from '@angular/fire/database';
import { TestBed } from '@angular/core/testing';
import { COMMON_CONFIG } from '../../test-config';
import { BehaviorSubject } from 'rxjs';
import { skip, switchMap, take } from 'rxjs/operators';
import 'firebase/compat/database';
import { rando } from '../../firestore/utils.spec';

describe('snapshotChanges', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;
  let createRef: (path: string) => firebase.database.Reference;
  let batch = {};
  const items = [{ name: 'zero' }, { name: 'one' }, { name: 'two' }].map((item, i) => ({ key: i.toString(), ...item }));
  Object.keys(items).forEach((key, i) => {
    batch[i] = items[key];
  });
  // make batch immutable to preserve integrity
  batch = Object.freeze(batch);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireDatabaseModule
      ],
      providers: [
        { provide: URL, useValue: 'http://localhost:9000' }
      ]
    });

    app = TestBed.inject(FirebaseApp);
    db = TestBed.inject(AngularFireDatabase);
    createRef = (path: string) => db.database.ref(path);
  });

  afterEach(() => {
    // try { app.delete() } catch(e) { };
  });

  function prepareSnapshotChanges(opts: { events?: ChildEvent[], skipnumber: number } = { skipnumber: 0 }) {
    const { events, skipnumber } = opts;
    const aref = createRef(rando());
    const snapChanges = snapshotChanges(aref, events);
    return {
      snapChanges: snapChanges.pipe(skip(skipnumber)),
      ref: aref
    };
  }

  it('should listen to all events by default', (done) => {
    const { snapChanges, ref } = prepareSnapshotChanges();
    snapChanges.pipe(take(1)).subscribe(actions => {
      const data = actions.map(a => a.payload.val());
      expect(data).toEqual(items);
    }).add(done);
    ref.set(batch);
  });

  it('should handle multiple subscriptions (hot)', (done) => {
    const { snapChanges, ref } = prepareSnapshotChanges();
    const sub = snapChanges.subscribe(() => {
    }).add(done);
    snapChanges.pipe(take(1)).subscribe(actions => {
      const data = actions.map(a => a.payload.val());
      expect(data).toEqual(items);
    }).add(sub);
    ref.set(batch);
  });

  it('should handle multiple subscriptions (warm)', done => {
    const { snapChanges, ref } = prepareSnapshotChanges();
    snapChanges.pipe(take(1)).subscribe(() => {
    }).add(() => {
      snapChanges.pipe(take(1)).subscribe(actions => {
        const data = actions.map(a => a.payload.val());
        expect(data).toEqual(items);
      }).add(done);
    });
    ref.set(batch);
  });

  it('should listen to only child_added events', (done) => {
    const { snapChanges, ref } = prepareSnapshotChanges({ events: ['child_added'], skipnumber: 0 });
    snapChanges.pipe(take(1)).subscribe(actions => {
      const data = actions.map(a => a.payload.val());
      expect(data).toEqual(items);
    }).add(done);
    ref.set(batch);
  });

  /* FLAKE? set promise not fufilling
  it('should listen to only child_added, child_changed events', (done) => {
    const { snapChanges, ref } = prepareSnapshotChanges({
      events: ['child_added', 'child_changed'],
      skipnumber: 1
    });
    const name = 'ligatures';
    snapChanges.pipe(take(1)).subscribe(actions => {
      const data = actions.map(a => a.payload!.val());;
      const copy = [...items];
      copy[0].name = name;
      expect(data).toEqual(copy);
    }).add(done);
    ref.set(batch).then(() => {
      ref.child(items[0].key).update({ name })
    });
  });*/

  it('should handle empty sets', done => {
    const aref = createRef(rando());
    aref.set({});
    snapshotChanges(aref).pipe(take(1)).subscribe(data => {
      expect(data.length).toEqual(0);
    }).add(done);
  });

  it('should handle dynamic queries that return empty sets', done => {
    let count = 0;
    const namefilter$ = new BehaviorSubject<number | null>(null);
    const aref = createRef(rando());
    aref.set(batch);
    namefilter$.pipe(switchMap(name => {
      const filteredRef = name ? aref.child('name').equalTo(name) : aref;
      return snapshotChanges(filteredRef);
    }), take(2)).subscribe(data => {
      count = count + 1;
      // the first time should all be 'added'
      if (count === 1) {
        expect(Object.keys(data).length).toEqual(3);
        namefilter$.next(-1);
      }
      // on the second round, we should have filtered out everything
      if (count === 2) {
        expect(Object.keys(data).length).toEqual(0);
      }
    }).add(done);
  });

});
