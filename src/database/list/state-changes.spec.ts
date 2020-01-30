import { database } from 'firebase/app';
import { FirebaseApp, AngularFireModule } from '@angular/fire';
import { AngularFireDatabase, AngularFireDatabaseModule, stateChanges, ChildEvent, URL } from '../public_api';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../../test-config';
import { skip } from 'rxjs/operators';
import 'firebase/database';
import { rando } from '../../firestore/utils.spec';

describe('stateChanges', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;
  let createRef: (path: string) => database.Reference;
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
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFireDatabaseModule
      ],
      providers: [
        { provide: URL, useValue: 'http://localhost:9000' }
      ]
    });
    inject([FirebaseApp, AngularFireDatabase], (app_: FirebaseApp, _db: AngularFireDatabase) => {
      app = app_;
      db = _db;
      createRef = (path: string) =>  db.database.ref(path);
    })();
  });

  afterEach(() => {
    app.delete();
  });

  function prepareStateChanges(opts: { events?: ChildEvent[], skipnumber: number } = { skipnumber: 0 }) {
    const { events, skipnumber } = opts;
    const aref = createRef(rando());
    aref.set(batch);
    const changes = stateChanges(aref, events);
    return {
      changes: changes.pipe(skip(skipnumber)),
      ref: aref
    };
  }

  it('should listen to all events by default', (done) => {

    const { changes } = prepareStateChanges({ skipnumber: 2 });
    changes.subscribe(action => {
      expect(action.key).toEqual('2');
      expect(action.payload.val()).toEqual(items[items.length - 1]);
      done();
    });

  });

});
