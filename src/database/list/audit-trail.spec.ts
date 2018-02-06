import { Reference } from '@firebase/database-types';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule, auditTrail, ChildEvent } from 'angularfire2/database';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';
import 'rxjs/add/operator/skip';

// generate random string to test fidelity of naming
const rando = () => (Math.random() + 1).toString(36).substring(7);
const FIREBASE_APP_NAME = rando();

describe('auditTrail', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;
  let createRef: (path: string) => Reference;
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

  function prepareAuditTrail(opts: { events?: ChildEvent[], skip: number } = { skip: 0 }) {
    const { events, skip } = opts;
    const aref = createRef(rando());
    aref.set(batch);
    const changes = auditTrail(aref, events);
    return {
      changes: changes.skip(skip),
      ref: aref
    };
  }

  it('should listen to all events by default', (done) => {

    const { changes } = prepareAuditTrail();
    changes.subscribe(actions => {
      const data = actions.map(a => a.payload.val());
      expect(data).toEqual(items);
      done();
    });

  });

});
