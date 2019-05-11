import { DatabaseReference } from '../interfaces';
import { FirebaseApp, AngularFireModule } from '@angular/fire';
import { AngularFireDatabase, AngularFireDatabaseModule, auditTrail, ChildEvent, RealtimeDatabaseURL } from '@angular/fire/database';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';
import { skip } from 'rxjs/operators';

// generate random string to test fidelity of naming
const rando = () => (Math.random() + 1).toString(36).substring(7);
const FIREBASE_APP_NAME = rando();

describe('auditTrail', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;
  let createRef: (path: string) => DatabaseReference;
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
      ],
      providers: [
        //{ provide: RealtimeDatabaseURL,  useValue: 'http://localhost:9000' }
      ]
    });
    inject([FirebaseApp, AngularFireDatabase], (app_: FirebaseApp, _db: AngularFireDatabase) => {
      app = app_;
      db = _db;
      createRef = (path: string) => db.database.ref(path);
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  function prepareAuditTrail(opts: { events?: ChildEvent[], skipnumber: number } = { skipnumber: 0 }) {
    const { events, skipnumber } = opts;
    const aref = createRef(rando());
    aref.set(batch);
    const changes = auditTrail(aref, events);
    return {
      changes: changes.pipe(skip(skipnumber)),
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
