import * as firebase from 'firebase/app';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule, fromRef } from 'angularfire2/database';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';

// generate random string to test fidelity of naming
const rando = () => (Math.random() + 1).toString(36).substring(7);
const FIREBASE_APP_NAME = rando();

fdescribe('fromRef', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;
  let ref: (path: string) => firebase.database.Reference;
  let batch = {};
  const items = [{ name: 'one' }, { name: 'two' }, { name: 'three' }];
  Object.keys(items).forEach(function (key) {
    var pushId = rando();
    var itemValue = items[key];
    batch[pushId] = itemValue;
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
      ref('items').set(batch);
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  describe('child_added', () => {

    it('should stream back a child_added event', (done: any) => {
      const obs = fromRef(ref('items'), 'child_added');
      let count = 0;
      const sub = obs.subscribe(change => {
        console.log(sub);
        count = count + 1;
        const { event, snapshot } = change;
        expect(event).toEqual('child_added');
        expect(snapshot!.val()).toEqual(batch[snapshot!.key!]);
        if (count === items.length) {
          done();
        }
        //sub.unsubscribe();
        //expect(sub.closed).toEqual(true);
      });
    });

  });

  describe('value', () => {

    it('should stream back a value event', (done: any) => {
      const obs = fromRef(ref('items'), 'value');
      const sub = obs.subscribe(change => {
        const { event, snapshot } = change;
        expect(event).toEqual('value');
        expect(snapshot!.val()).toEqual(batch);
        done();
        // sub.unsubscribe();
        // expect(sub.closed).toEqual(true);
      });
    });

  });

});
