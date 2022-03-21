import { AngularFireModule, FirebaseApp } from '@angular/fire/compat';
import { AngularFireDatabase, AngularFireDatabaseModule, auditTrail, ChildEvent, URL } from '@angular/fire/compat/database';
import { TestBed } from '@angular/core/testing';
import { COMMON_CONFIG } from '../../../test-config';
import { skip } from 'rxjs/operators';
import 'firebase/compat/database';
import firebase from 'firebase/compat/app';
import { rando } from '../../../utils';

describe('auditTrail', () => {
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
     try { app.delete().catch(() => undefined); } catch (e) { }
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
