import { TestBed } from '@angular/core/testing';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabase, AngularFireDatabaseModule, ChildEvent, URL, stateChanges } from '@angular/fire/compat/database';
import firebase from 'firebase/compat/app';
import { skip } from 'rxjs/operators';
import { COMMON_CONFIG } from '../../../../src/test-config';
import 'firebase/compat/database';
import { rando } from '../../../../src/utils';

describe('stateChanges', () => {
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

    db = TestBed.inject(AngularFireDatabase);
    createRef = (path: string) => db.database.ref(path);
  });

  afterEach(() => {
    db.database.goOffline();
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
