import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFirestore, AngularFirestoreModule, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import * as firebase from 'firebase/app';
import * as firestore from 'firestore';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from './test-config';

interface Stock {
  name: string;
  price: number;
}

const FAKE_STOCK_DATA = { name: 'FAKE', price: 1 };

const randomName = (firestore): string => firestore.collection('a').doc().id;

const createRandomStocks = async (firestore: firestore.Firestore, collectionRef: firestore.CollectionReference, numberOfItems) => {
  // Create a batch to update everything at once
  const batch = firestore.batch();
  // Store the random names to delete them later
  let count = 0;
  let names: string[] = [];
  Array.from(Array(numberOfItems)).forEach((a, i) => {
    const name = randomName(firestore);
    batch.set(collectionRef.doc(name), FAKE_STOCK_DATA);
    names = [...names, name];
  });
  // Create the batch entries
  // Commit!
  await batch.commit();
  return names;
}

describe('Firestore', () => {
  let app: firebase.app.App;
  let afs: AngularFirestore;
  let sub: Subscription;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFirestoreModule
      ]
    });
    inject([FirebaseApp, AngularFirestore], (_app: firebase.app.App, _afs: AngularFirestore) => {
      app = _app;
      afs = _afs;
    })();
  });

  afterEach(async (done) => {
    await app.delete();
    done();
  });

  describe('AngularFirestore', () => {

    it('should be the properly initialized type', () => {
      expect(afs instanceof AngularFirestore).toBe(true);
    });

    it('should have an initialized Firebase app', () => {
      expect(afs.app).toBeDefined();
    });

    it('should create an AngularFirestoreDocument', () => {
      const doc = afs.doc('a/doc');
      expect(doc instanceof AngularFirestoreDocument).toBe(true);
    });

    it('should create an AngularFirestoreCollection', () => {
      const collection = afs.collection('stuffs');
      expect(collection instanceof AngularFirestoreCollection).toBe(true);
    });

    it('should throw on an invalid document path', () => {
      const singleWrapper = () => afs.doc('collection');
      const tripleWrapper = () => afs.doc('collection/doc/subcollection');
      expect(singleWrapper).toThrowError();
      expect(tripleWrapper).toThrowError();
    });    

    it('should throw on an invalid collection path', () => {
      const singleWrapper = () => afs.collection('collection/doc');
      const quadWrapper = () => afs.collection('collection/doc/subcollection/doc');
      expect(singleWrapper).toThrowError();
      expect(quadWrapper).toThrowError();
    });        

  });

  describe('AngularFirestoreDocument', () => {

    it('should get unwrapped data as an Observable', async (done: any) => {
      const randomCollectionName = afs.firestore.collection('a').doc().id;
      const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`);
      const stock = new AngularFirestoreDocument<Stock>(ref);
      await stock.set(FAKE_STOCK_DATA);
      const obs$ = Observable.from(stock);
      const sub = obs$.catch(e => { console.log(e); return e; })
        .take(1) // this will unsubscribe after the first
        .subscribe(async (data: Stock) => {
          sub.unsubscribe();
          expect(JSON.stringify(data)).toBe(JSON.stringify(FAKE_STOCK_DATA));
          stock.delete().then(done).catch(done.fail);
        });
    });

    it('should get snapshot updates', async (done: any) => {
      const randomCollectionName = randomName(afs.firestore);
      const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`);
      const stock = new AngularFirestoreDocument<Stock>(ref);
      await stock.set(FAKE_STOCK_DATA);
      const sub = stock
        .snapshotChanges()
        .subscribe(async a => {
          sub.unsubscribe();
          if (a.exists) {
            expect(a.data()).toEqual(FAKE_STOCK_DATA);
            stock.delete().then(done).catch(done.fail);
          }
        });
    });

    it('should get unwrapped snapshot', async (done: any) => {
      const randomCollectionName = afs.firestore.collection('a').doc().id;
      const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`);
      const stock = new AngularFirestoreDocument<Stock>(ref);
      await stock.set(FAKE_STOCK_DATA);
      const obs$ = stock.valueChanges();
      const sub = obs$.catch(e => { console.log(e); return e; })
        .take(1) // this will unsubscribe after the first
        .subscribe(async (data: Stock) => {
          sub.unsubscribe();
          expect(JSON.stringify(data)).toBe(JSON.stringify(FAKE_STOCK_DATA));
          stock.delete().then(done).catch(done.fail);
        });
    });


  });

  describe('AngularFirestoreCollection', () => {

    it('should get unwrapped snapshot', async (done: any) => {
      const randomCollectionName = randomName(afs.firestore);
      const ref = afs.firestore.collection(`${randomCollectionName}`);
      const stocks = new AngularFirestoreCollection<Stock>(ref, ref);
      const ITEMS = 4;
      
      const names = await createRandomStocks(afs.firestore, ref, ITEMS)

      const sub = stocks.valueChanges().subscribe(data => {
        // unsub immediately as we will be deleting data at the bottom
        // and that will trigger another subscribe callback and fail
        // the test
        sub.unsubscribe();
        // We added four things. This should be four.
        // This could not be four if the batch failed or
        // if the collection state is altered during a test run
        expect(data.length).toEqual(ITEMS);
        data.forEach(stock => {
          // We used the same piece of data so they should all equal
          expect(stock).toEqual(FAKE_STOCK_DATA);
        });
        // Delete them all
        const promises = names.map(name => ref.doc(name).delete());
        Promise.all(promises).then(done).catch(fail);
      });

    });

    it('should get snapshot updates', async (done: any) => {
      const randomCollectionName = randomName(afs.firestore);
      const ref = afs.firestore.collection(`${randomCollectionName}`);
      const stocks = new AngularFirestoreCollection<Stock>(ref, ref);
      const ITEMS = 10;
      
      const names = await createRandomStocks(afs.firestore, ref, ITEMS);

      const sub = stocks.snapshotChanges().subscribe(data => {
        // unsub immediately as we will be deleting data at the bottom
        // and that will trigger another subscribe callback and fail
        // the test
        sub.unsubscribe();
        // We added ten things. This should be ten.
        // This could not be ten if the batch failed or
        // if the collection state is altered during a test run
        expect(data.docs.length).toEqual(ITEMS);
        data.docs.forEach(stock => {
          // We used the same piece of data so they should all equal
          expect(stock.data()).toEqual(FAKE_STOCK_DATA);
        });
        // Delete them all
        const promises = names.map(name => ref.doc(name).delete());
        Promise.all(promises).then(done).catch(fail);
      });
      
    });

    it('should be able to filter by docChanges', async(done: any) => {
      const randomCollectionName = randomName(afs.firestore);
      const ref = afs.firestore.collection(`${randomCollectionName}`);
      const stocks = new AngularFirestoreCollection<Stock>(ref, ref);

      const added$ = stocks.snapshotChanges()
        .map(snap => snap.docChanges.filter(change => change.type === 'added'))
        .filter(snap => snap.length > 0);
      
      const modified$ = stocks.snapshotChanges()
        .map(snap => snap.docChanges.filter(change => change.type === 'modified'))
        .filter(snap => snap.length > 0);

      const removed$ = stocks.snapshotChanges()
        .map(snap => snap.docChanges.filter(change => change.type === 'removed'))
        .filter(snap => snap.length > 0);

      added$.subscribe(added => {
        // there should only be one addition
        expect(added.length).toEqual(1)
        const change = added[0];
        expect(change.doc.data()).toEqual(FAKE_STOCK_DATA);
      });

      modified$.subscribe(added => {
        // there should only be one modification
        expect(added.length).toEqual(1);
        const change = added[0];
        expect(change.doc.data()).toEqual({ name: 'FAKE', price: 2 });
      });      
      
      removed$.subscribe(added => {
        // there should only be one removal
        expect(added.length).toEqual(1);
        const change = added[0];
        expect(change.doc.data()).toEqual({ name: 'FAKE', price: 2 });
        // delete and done
        change.doc.ref.delete().then(done).catch(done.fail);
      });   

      const randomDocName = randomName(afs.firestore);
      const addedRef = stocks.doc(randomDocName);
      addedRef.set(FAKE_STOCK_DATA);
      addedRef.update({ price: 2 });
      addedRef.delete();
          
    });

  });

});