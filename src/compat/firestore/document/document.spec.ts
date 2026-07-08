import { TestBed } from '@angular/core/testing';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreModule, DocumentReference, USE_EMULATOR } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { take } from 'rxjs/operators';
import { COMMON_CONFIG, firestoreEmulatorPort } from '../../../test-config';
import { rando } from '../../../utils';
import { FAKE_STOCK_DATA, Stock, randomName } from '../utils.spec';
import 'firebase/compat/firestore';

// TODO(davideast): Investage this flake on Safari.
describe('AngularFirestoreDocument', () => {
  let afs: AngularFirestore;

  beforeEach(() => {
    pending("These are pretty broken, investigate.");

    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFirestoreModule
      ],
      providers: [
        { provide: USE_EMULATOR, useValue: ['localhost', firestoreEmulatorPort] }
      ]
    });

    afs = TestBed.inject(AngularFirestore);
  });

  describe('valueChanges()', () => {

    it('should get unwrapped snapshot', done => {
      (async () => {
        const randomCollectionName = TestBed.runInInjectionContext(() => afs.firestore.collection('a').doc().id);
        const ref = TestBed.runInInjectionContext(() => afs.firestore.doc(`${randomCollectionName}/FAKE`)) as firebase.firestore.DocumentReference<Stock>;
        const stock = new AngularFirestoreDocument(ref, afs);
        await TestBed.runInInjectionContext(() => stock.set(FAKE_STOCK_DATA));
        const obs$ = TestBed.runInInjectionContext(() => stock.valueChanges());
        obs$.pipe(take(1)).subscribe(data => {
          expect(data).toEqual(FAKE_STOCK_DATA);
          done();
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
        const ref = TestBed.runInInjectionContext(() => afs.firestore.doc(`${randomCollectionName}/FAKE`)) as DocumentReference<Stock>;
        const stock = new AngularFirestoreDocument<Stock>(ref, afs);
        await TestBed.runInInjectionContext(() => stock.set(FAKE_STOCK_DATA));
        const sub = TestBed.runInInjectionContext(() => stock.snapshotChanges()).subscribe(a => {
          sub.unsubscribe();
          expect(a.payload.exists).toBeTrue();
          expect(a.payload.data()).toEqual(FAKE_STOCK_DATA);
          done();
        });
      })();
    });

    it('should get unwrapped snapshot', done => {
      (async () => {
        const randomCollectionName = afs.firestore.collection('a').doc().id;
        const ref = TestBed.runInInjectionContext(() => afs.firestore.doc(`${randomCollectionName}/FAKE`)) as DocumentReference<Stock>;
        const stock = new AngularFirestoreDocument<Stock>(ref, afs);
        await TestBed.runInInjectionContext(() => stock.set(FAKE_STOCK_DATA));
        const obs$ = TestBed.runInInjectionContext(() => stock.valueChanges());
        obs$.pipe(take(1)).subscribe(data => {
          expect(data).toEqual(FAKE_STOCK_DATA);
          done();
        });
      })();
    });

  });

});
