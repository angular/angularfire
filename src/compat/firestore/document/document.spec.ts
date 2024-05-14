import { TestBed } from '@angular/core/testing';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreModule, DocumentReference, USE_EMULATOR } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { take } from 'rxjs/operators';
import { COMMON_CONFIG } from '../../../../src/test-config';
import { rando } from '../../../../src/utils';
import { FAKE_STOCK_DATA, Stock, randomName } from '../utils.spec';
import 'firebase/compat/firestore';

// TODO(davideast): Investage this flake on Safari.
describe('AngularFirestoreDocument', () => {
  let afs: AngularFirestore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFirestoreModule
      ],
      providers: [
        { provide: USE_EMULATOR, useValue: ['localhost', 8089] }
      ]
    });

    afs = TestBed.inject(AngularFirestore);
  });

  afterEach(() => {
    afs.firestore.disableNetwork();
  });

  describe('valueChanges()', () => {

    it('should get unwrapped snapshot', done => {
      (async () => {
        const randomCollectionName = afs.firestore.collection('a').doc().id;
        const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`) as firebase.firestore.DocumentReference<Stock>;
        const stock = new AngularFirestoreDocument(ref, afs);
        await stock.set(FAKE_STOCK_DATA);
        const obs$ = stock.valueChanges();
        obs$.pipe(take(1)).subscribe(data => {
          expect(data).toEqual(FAKE_STOCK_DATA);
          stock.delete().then(done).catch(done.fail);
        });
      })();
    });

    /* TODO(jamesdaniels): test is flaking, look into this
    it('should optionally map the doc ID to the emitted data object', done => {
      (async () => {
        const randomCollectionName = afs.firestore.collection('a').doc().id;
        const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`);
        const stock = new AngularFirestoreDocument<Stock>(ref, afs);
        await stock.set(FAKE_STOCK_DATA);
        const idField = 'myCustomID';
        const obs$ = stock.valueChanges({ idField });
        obs$.pipe(take(1)).subscribe(async data => {
          expect(data[idField]).toBeDefined();
          expect(data).toEqual(jasmine.objectContaining(FAKE_STOCK_DATA));
          stock.delete().then(done).catch(done.fail);
        });
      })();
    });*/

  });

  describe('snapshotChanges()', () => {

    it('should get action updates', done => {
      (async () => {
        const randomCollectionName = randomName(afs.firestore);
        const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`) as DocumentReference<Stock>;
        const stock = new AngularFirestoreDocument<Stock>(ref, afs);
        await stock.set(FAKE_STOCK_DATA);
        const sub = stock
          .snapshotChanges()
          .subscribe(a => {
            sub.unsubscribe();
            if (a.payload.exists) {
              expect(a.payload.data()).toEqual(FAKE_STOCK_DATA);
              stock.delete().then(done).catch(done.fail);
            }
          });
      })();
    });

    it('should get unwrapped snapshot', done => {
      (async () => {
        const randomCollectionName = afs.firestore.collection('a').doc().id;
        const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`) as DocumentReference<Stock>;
        const stock = new AngularFirestoreDocument<Stock>(ref, afs);
        await stock.set(FAKE_STOCK_DATA);
        const obs$ = stock.valueChanges();
        obs$.pipe(take(1)).subscribe(data => {
          expect(data).toEqual(FAKE_STOCK_DATA);
          stock.delete().then(done).catch(done.fail);
        });
      })();
    });

  });

});
