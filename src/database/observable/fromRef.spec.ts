import { DatabaseReference } from '../interfaces';
import { FirebaseApp, AngularFireModule, ZoneScheduler } from '@angular/fire';
import { AngularFireDatabase, AngularFireDatabaseModule, fromRef } from '@angular/fire/database';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';
import { take } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

// generate random string to test fidelity of naming
const rando = () => (Math.random() + 1).toString(36).substring(7);
const FIREBASE_APP_NAME = rando();

describe('fromRef', () => {
  let app: FirebaseApp;
  let ref: (path: string) => DatabaseReference;
  let batch = {};
  const items = [{ name: 'one' }, { name: 'two' }, { name: 'three' }].map(item => ({ key: rando(), ...item }));
  Object.keys(items).forEach(function (key) {
    const itemValue = items[key];
    batch[itemValue.key] = itemValue;
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
    inject([FirebaseApp], (app_: FirebaseApp) => {
      app = app_;
      app.database().goOffline();
      ref = (path: string) => { app.database().goOffline(); return app.database().ref(path); };
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  it('it should be async by default', (done) => {
    const itemRef = ref(rando());
    itemRef.set(batch);
    const obs = fromRef(itemRef, 'value');
    let count = 0;
    expect(count).toEqual(0);
    const sub = obs.subscribe(change => {
      count = count + 1;
      expect(count).toEqual(1);
      sub.unsubscribe();
      done();
    });
    expect(count).toEqual(0);
  });

  it('should take a scheduler', done => {
    const itemRef = ref(rando());
    itemRef.set(batch);

    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    spyOn(testScheduler, 'schedule').and.callThrough();

    const obs = fromRef(itemRef, 'value', 'once', testScheduler);
    expect(testScheduler.schedule).not.toHaveBeenCalled();

    obs.subscribe(() => {
      expect(testScheduler.schedule).toHaveBeenCalled();
      done();
    }, err => {
      console.error(err);
      expect(false).toEqual(true, "Shouldnt error");
      done();
    }, () => {
      expect(testScheduler.schedule).toHaveBeenCalled();
      done()
    });
    testScheduler.flush();
  });

  it('should schedule completed and error correctly', done => {
    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    spyOn(testScheduler, 'schedule').and.callThrough();

    // Error
    const errorObservable = fromRef({
      once: (event, snap, err) => err()
    } as any,
      'value',
      'once',
      testScheduler
    );
    errorObservable.subscribe(() => {
      fail("Should not emit");
    }, () => {
      expect(testScheduler.schedule).toHaveBeenCalled();
    }, () => {
      fail("Should not complete");
    });

    testScheduler.flush();

    // Completed
    const itemRef = ref(rando());
    itemRef.set(batch);

    const scheduler = new ZoneScheduler(Zone.current.fork({
      name: 'ExpectedZone'
    }));
    const completeObservable = fromRef(
      itemRef,
      'value',
      'once',
      scheduler
    );
    completeObservable.subscribe(
      () => { },
      () => fail("Should not error"),
      () => expect(Zone.current.name).toEqual("ExpectedZone")
    );
    testScheduler.flush();
    done();
  });


  it('it should should handle non-existence', (done) => {
    const itemRef = ref(rando());
    itemRef.set({});
    const obs = fromRef(itemRef, 'value');
    const sub = obs.pipe(take(1)).subscribe(change => {
      expect(change.payload.exists()).toEqual(false);
      expect(change.payload.val()).toEqual(null);
    }).add(done);
  });

  it('once should complete', (done) => {
    const itemRef = ref(rando());
    itemRef.set(batch);
    const obs = fromRef(itemRef, 'value', 'once');
    obs.subscribe(change => { }, () => { }, done);
  });

  it('it should listen and then unsubscribe', (done) => {
    const itemRef = ref(rando());
    itemRef.set(batch);
    const obs = fromRef(itemRef, 'value');
    let count = 0;
    const sub = obs.subscribe(change => {
      count = count + 1;
      // hard coding count to one will fail if the unsub
      // doesn't actually unsub
      expect(count).toEqual(1);
      done();
      sub.unsubscribe();
      itemRef.push({ name: 'anotha one' });
    });
  });

  describe('events', () => {

    it('should stream back a child_added event', async (done: any) => {
      const itemRef = ref(rando());
      itemRef.set(batch);
      const obs = fromRef(itemRef, 'child_added');
      let count = 0;
      const sub = obs.subscribe(change => {
        count = count + 1;
        const { type, payload } = change;
        expect(type).toEqual('child_added');
        expect(payload.val()).toEqual(batch[payload.key!]);
        if (count === items.length) {
          done();
          sub.unsubscribe();
          expect(sub.closed).toEqual(true);
        }
      });
    });

    it('should stream back a child_changed event', async (done: any) => {
      const itemRef = ref(rando());
      itemRef.set(batch);
      const obs = fromRef(itemRef, 'child_changed');
      const name = 'look at what you made me do';
      const key = items[0].key;
      const sub = obs.subscribe(change => {
        const { type, payload } = change;
        expect(type).toEqual('child_changed');
        expect(payload.key).toEqual(key);
        expect(payload.val()).toEqual({ key, name });
        sub.unsubscribe();
        done();
      });
      itemRef.child(key).update({ name });
    });

    it('should stream back a child_removed event', async (done: any) => {
      const itemRef = ref(rando());
      itemRef.set(batch);
      const obs = fromRef(itemRef, 'child_removed');
      const key = items[0].key;
      const name = items[0].name;
      const sub = obs.subscribe(change => {
        const { type, payload } = change;
        expect(type).toEqual('child_removed');
        expect(payload.key).toEqual(key);
        expect(payload.val()).toEqual({ key, name });
        sub.unsubscribe();
        done();
      });
      itemRef.child(key).remove();
    });

    it('should stream back a child_moved event', async (done: any) => {
      const itemRef = ref(rando());
      itemRef.set(batch);
      const obs = fromRef(itemRef, 'child_moved');
      const key = items[2].key;
      const name = items[2].name;
      const sub = obs.subscribe(change => {
        const { type, payload } = change;
        expect(type).toEqual('child_moved');
        expect(payload.key).toEqual(key);
        expect(payload.val()).toEqual({ key, name });
        sub.unsubscribe();
        done();
      });
      itemRef.child(key).setPriority(-100, () => { });
    });

    it('should stream back a value event', (done: any) => {
      const itemRef = ref(rando());
      itemRef.set(batch);
      const obs = fromRef(itemRef, 'value');
      const sub = obs.subscribe(change => {
        const { type, payload } = change;
        expect(type).toEqual('value');
        expect(payload.val()).toEqual(batch);
        done();
        sub.unsubscribe();
        expect(sub.closed).toEqual(true);
      });
    });

    it('should stream back query results', (done: any) => {
      const itemRef = ref(rando());
      itemRef.set(batch);
      const query = itemRef.orderByChild('name').equalTo(items[0].name);
      const obs = fromRef(query, 'value');
      const sub = obs.subscribe(change => {
        let child;
        change.payload.forEach(snap => { child = snap.val(); return true; });
        expect(child).toEqual(items[0]);
        done();
      });
    });

  });

});
