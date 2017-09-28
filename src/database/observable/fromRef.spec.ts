import * as firebase from 'firebase/app';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule, fromRef } from 'angularfire2/database';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';

// generate random string to test fidelity of naming
const rando = () => (Math.random() + 1).toString(36).substring(7);
const FIREBASE_APP_NAME = rando();

describe('fromRef', () => {
  let app: FirebaseApp;
  let ref: (path: string) => firebase.database.Reference;
  let batch = {};
  const items = [{ name: 'one' }, { name: 'two' }, { name: 'three' }].map(item => ( { key: rando(), ...item } ));
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

  it('it should be async', (done) => {
    const itemRef = ref(rando());
    itemRef.set(batch);
    const obs = fromRef(itemRef, 'value');
    let count = 0;
    expect(count).toEqual(0);
    const sub = obs.subscribe(change => {
      count = count + 1;
      expect(count).toEqual(1);
      done();
      sub.unsubscribe();
    });
    expect(count).toEqual(0);
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
        expect(payload!.val()).toEqual(batch[payload!.key!]);
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
        expect(payload!.key).toEqual(key);
        expect(payload!.val()).toEqual({ key, name });
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
        expect(payload!.key).toEqual(key);
        expect(payload!.val()).toEqual({ key, name });
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
        expect(payload!.key).toEqual(key);
        expect(payload!.val()).toEqual({ key, name });
        sub.unsubscribe();
        done();
      });
      itemRef.child(key).setPriority(-100, () => {});
    });    

    it('should stream back a value event', (done: any) => {
      const itemRef = ref(rando());
      itemRef.set(batch);
      const obs = fromRef(itemRef, 'value');
      const sub = obs.subscribe(change => {
        const { type, payload } = change;
        expect(type).toEqual('value');
        expect(payload!.val()).toEqual(batch);
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
        change.payload!.forEach(snap => { child = snap.val(); return true; });
        expect(child).toEqual(items[0]);
        done();
      });
    });
    
  });

});
