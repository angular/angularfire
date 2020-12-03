import { AngularFireModule, FirebaseApp } from '@angular/fire';
import { AngularFirestore, SETTINGS, AngularFirestoreModule, AngularFirestoreDocument, DocumentReference } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';

import { TestBed } from '@angular/core/testing';
import { COMMON_CONFIG } from '../../test-config';

import { FAKE_STOCK_DATA, rando, randomName, Stock } from '../utils.spec';
import firebase from 'firebase/app';
import 'firebase/firestore';

describe('AngularFirestoreDocument', () => {
  let app: FirebaseApp;
  let afs: AngularFirestore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFirestoreModule
      ],
      providers: [
        { provide: SETTINGS, useValue: { host: 'localhost:8080', ssl: false } }
      ]
    });

    app = TestBed.inject(FirebaseApp);
    afs = TestBed.inject(AngularFirestore);
  });

  afterEach(() => {
    app.delete();
  });

  describe('valueChanges()', () => {

    it('should get unwrapped snapshot', async (done: any) => {
      const randomCollectionName = afs.firestore.collection('a').doc().id;
      const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`) as firebase.firestore.DocumentReference<Stock>;
      const stock = new AngularFirestoreDocument(ref, afs);
      await stock.set(FAKE_STOCK_DATA);
      const obs$ = stock.valueChanges();
      obs$.pipe(take(1)).subscribe(async data => {
        expect(data).toEqual(FAKE_STOCK_DATA);
        stock.delete().then(done).catch(done.fail);
      });
    });

    /* TODO(jamesdaniels): test is flaking, look into this
    it('should optionally map the doc ID to the emitted data object', async (done: any) => {
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
    });*/

  });

  describe('snapshotChanges()', () => {

    it('should get action updates', async (done: any) => {
      const randomCollectionName = randomName(afs.firestore);
      const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`) as DocumentReference<Stock>;
      const stock = new AngularFirestoreDocument<Stock>(ref, afs);
      await stock.set(FAKE_STOCK_DATA);
      const sub = stock
        .snapshotChanges()
        .subscribe(async a => {
          sub.unsubscribe();
          if (a.payload.exists) {
            expect(a.payload.data()).toEqual(FAKE_STOCK_DATA);
            stock.delete().then(done).catch(done.fail);
          }
        });
    });

    it('should get unwrapped snapshot', async (done: any) => {
      const randomCollectionName = afs.firestore.collection('a').doc().id;
      const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`) as DocumentReference<Stock>;
      const stock = new AngularFirestoreDocument<Stock>(ref, afs);
      await stock.set(FAKE_STOCK_DATA);
      const obs$ = stock.valueChanges();
      obs$.pipe(take(1)).subscribe(async data => {
        expect(data).toEqual(FAKE_STOCK_DATA);
        stock.delete().then(done).catch(done.fail);
      });
    });

  });

});
