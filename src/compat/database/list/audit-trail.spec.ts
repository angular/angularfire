import { TestBed } from '@angular/core/testing';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabase, AngularFireDatabaseModule, ChildEvent, USE_EMULATOR, auditTrail } from '@angular/fire/compat/database';
import firebase from 'firebase/compat/app';
import { skip } from 'rxjs/operators';
import { COMMON_CONFIG, databaseEmulatorPort } from '../../../../src/test-config';
import 'firebase/compat/database';
import { rando } from '../../../../src/utils';

describe('auditTrail', () => {
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
        { provide: USE_EMULATOR, useValue: ['localhost', databaseEmulatorPort] }
      ]
    });

    db = TestBed.inject(AngularFireDatabase);
    createRef = (path: string) => db.database.ref(path);
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
