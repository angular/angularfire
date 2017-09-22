import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFirestore } from '../firestore';
import { AngularFirestoreModule } from '../firestore.module';
import { AngularFirestoreDocument } from '../document/document';
import { AngularFirestoreCollection } from './collection';

import * as firebase from 'firebase/app';
import * as firestore from 'firestore';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/skip';

import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';

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

describe('AngularFirestoreCollection', () => {
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

  function deleteThemAll(names, ref) {
    const promises = names.map(name => ref.doc(name).delete());
    return Promise.all(promises);
  }

  function delayUpdate<T>(collection: AngularFirestoreCollection<T>, path, data, delay = 250) {
    setTimeout(() => {
      collection.doc(path).update(data);
    }, delay);
  }

  function delayAdd<T>(collection: AngularFirestoreCollection<T>, path, data, delay = 250) {
    setTimeout(() => {
      collection.doc(path).set(data);
    }, delay);
  }

  function delayDelete<T>(collection: AngularFirestoreCollection<T>, path, delay = 250) {
    setTimeout(() => {
      collection.doc(path).delete();
    }, delay);
  }  

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
      expect(data.length).toEqual(ITEMS);
      data.forEach(action => {
        // We used the same piece of data so they should all equal
        expect(action.payload.doc.data()).toEqual(FAKE_STOCK_DATA);
      });
      deleteThemAll(names, ref).then(done).catch(done.fail);
    });
    
  });

  it('should listen to all changes by default', async (done) => {
    const randomCollectionName = randomName(afs.firestore);
    const ref = afs.firestore.collection(`${randomCollectionName}`);
    const stocks = new AngularFirestoreCollection<Stock>(ref, ref);
    const ITEMS = 10;
    let count = 0;
    const names = await createRandomStocks(afs.firestore, ref, ITEMS);
    const sub = stocks.snapshotChanges().subscribe(data => {
      count = count + 1;
      if(count === 1) {
        stocks.doc(names[0]).update({ price: 2});
      }
      if(count === 2) {
        expect(data.length).toEqual(1);
        expect(data[0].type).toEqual('modified');
        deleteThemAll(names, ref).then(done).catch(done.fail);
      }
    });
  });
  
  it('should be able to filter change types - modified', async (done) => {
    const randomCollectionName = randomName(afs.firestore);
    const ref = afs.firestore.collection(`${randomCollectionName}`);
    const stocks = new AngularFirestoreCollection<Stock>(ref, ref);
    const ITEMS = 10;
    let count = 0;
    const names = await createRandomStocks(afs.firestore, ref, ITEMS);
    
    const sub = stocks.snapshotChanges(['modified']).subscribe(data => {
      expect(data.length).toEqual(1);
      expect(data[0].payload.doc.data().price).toEqual(2);
      expect(data[0].type).toEqual('modified');
      deleteThemAll(names, ref).then(done).catch(done.fail);
      done();
    });

    delayUpdate(stocks, names[0], { price: 2 });
  });

  it('should be able to filter change types - added', async (done) => {
    const randomCollectionName = randomName(afs.firestore);
    const ref = afs.firestore.collection(`${randomCollectionName}`);
    const stocks = new AngularFirestoreCollection<Stock>(ref, ref);
    const ITEMS = 10;
    let count = 0;
    let names = await createRandomStocks(afs.firestore, ref, ITEMS);
    
    const sub = stocks.snapshotChanges(['added']).skip(1).subscribe(data => {
      expect(data.length).toEqual(1);
      expect(data[0].payload.doc.data().price).toEqual(2);
      expect(data[0].type).toEqual('added');
      deleteThemAll(names, ref).then(done).catch(done.fail);
      done();
    });

    const nextId = ref.doc('a').id;
    names = names.concat([nextId]);
    delayAdd(stocks, nextId, { price: 2 });
  });

  fit('should be able to filter change types - removed', async (done) => {
    const randomCollectionName = randomName(afs.firestore);
    const ref = afs.firestore.collection(`${randomCollectionName}`);
    const stocks = new AngularFirestoreCollection<Stock>(ref, ref);
    const ITEMS = 10;
    let count = 0;
    let names = await createRandomStocks(afs.firestore, ref, ITEMS);
    
    const sub = stocks.snapshotChanges(['removed']).subscribe(data => {
      debugger;
      expect(data.length).toEqual(1);
      expect(data[0].type).toEqual('removed');
      deleteThemAll(names, ref).then(done).catch(done.fail);
      done();
    });

    debugger;
    delayDelete(stocks, names[0], 400);
  });  

});