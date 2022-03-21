import firebase from 'firebase/compat/app';
import { AngularFireModule, FirebaseApp } from '@angular/fire/compat';
import { AngularFireDatabase, AngularFireDatabaseModule, listChanges, URL } from '@angular/fire/compat/database';
import { TestBed } from '@angular/core/testing';
import { COMMON_CONFIG } from '../../../test-config';
import { skip, take } from 'rxjs/operators';
import 'firebase/compat/database';
import { rando } from '../../../utils';

describe('listChanges', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;
  let ref: (path: string) => firebase.database.Reference;
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
    ref = (path: string) => db.database.ref(path);
  });

  afterEach(() => {
     try { app.delete().catch(() => undefined); } catch (e) { }
  });

  describe('events', () => {

    it('should stream value at first', (done) => {
      const someRef = ref(rando());
      const obs = listChanges(someRef, ['child_added']);
      obs.pipe(take(1)).subscribe(changes => {
        const data = changes.map(change => change.payload.val());
        expect(data).toEqual(items);
      }).add(done);
      someRef.set(batch);
    });

    it('should process a new child_added event', done => {
      const aref = ref(rando());
      const obs = listChanges(aref, ['child_added']);
      obs.pipe(skip(1), take(1)).subscribe(changes => {
        const data = changes.map(change => change.payload.val());
        expect(data[3]).toEqual({ name: 'anotha one' });
      }).add(done);
      aref.set(batch);
      aref.push({ name: 'anotha one' });
    });

    it('should stream in order events', (done) => {
      const aref = ref(rando());
      const obs = listChanges(aref.orderByChild('name'), ['child_added']);
      obs.pipe(take(1)).subscribe(changes => {
        const names = changes.map(change => change.payload.val().name);
        expect(names[0]).toEqual('one');
        expect(names[1]).toEqual('two');
        expect(names[2]).toEqual('zero');
      }).add(done);
      aref.set(batch);
    });

    it('should stream in order events w/child_added', (done) => {
      const aref = ref(rando());
      const obs = listChanges(aref.orderByChild('name'), ['child_added']);
      obs.pipe(skip(1), take(1)).subscribe(changes => {
        const names = changes.map(change => change.payload.val().name);
        expect(names[0]).toEqual('anotha one');
        expect(names[1]).toEqual('one');
        expect(names[2]).toEqual('two');
        expect(names[3]).toEqual('zero');
      }).add(done);
      aref.set(batch);
      aref.push({ name: 'anotha one' });
    });

    it('should stream events filtering', (done) => {
      const aref = ref(rando());
      const obs = listChanges(aref.orderByChild('name').equalTo('zero'), ['child_added']);
      obs.pipe(skip(1), take(1)).subscribe(changes => {
        const names = changes.map(change => change.payload.val().name);
        expect(names[0]).toEqual('zero');
        expect(names[1]).toEqual('zero');
      }).add(done);
      aref.set(batch);
      aref.push({ name: 'zero' });
    });


    /* FLAKES? aref.set not fufilling

    it('should process a new child_removed event', done => {
      const aref = ref(rando());
      const obs = listChanges(aref, ['child_added','child_removed']);
      aref.set(batch).then(() => {
        const sub = obs.pipe(skip(1),take(1)).subscribe(changes => {
          const data = changes.map(change => change.payload.val());
          expect(data.length).toEqual(items.length - 1);
        }).add(done);
        aref.child(items[0].key).remove();
      });
    });

    it('should process a new child_changed event', (done) => {
      const aref = ref(rando());
      const obs = listChanges(aref, ['child_added','child_changed'])
      aref.set(batch).then(() => {
        const sub = obs.pipe(skip(1),take(1)).subscribe(changes => {
          const data = changes.map(change => change.payload.val());
          expect(data[1].name).toEqual('lol');
        }).add(done);
        aref.child(items[1].key).update({ name: 'lol'});
      });
    });

    it('should process a new child_moved event', (done) => {
      const aref = ref(rando());
      const obs = listChanges(aref, ['child_added','child_moved'])
      aref.set(batch).then(() => {
        const sub = obs.pipe(skip(1),take(1)).subscribe(changes => {
          const data = changes.map(change => change.payload.val());
          // We moved the first item to the last item, so we check that
          // the new result is now the last result
          expect(data[data.length - 1]).toEqual(items[0]);
        }).add(done);
        aref.child(items[0].key).setPriority('a', () => {});
      });
    });*/

  });

});
