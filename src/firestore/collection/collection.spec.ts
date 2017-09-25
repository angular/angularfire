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

import { Stock, randomName, FAKE_STOCK_DATA, createRandomStocks, delayAdd, delayDelete, delayUpdate, deleteThemAll } from '../utils.spec';

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

  it('should get stateChanges() updates', async (done: any) => {
    const randomCollectionName = randomName(afs.firestore);
    const ref = afs.firestore.collection(`${randomCollectionName}`);
    const stocks = new AngularFirestoreCollection<Stock>(ref, ref);
    const ITEMS = 10;
    
    const names = await createRandomStocks(afs.firestore, ref, ITEMS);

    const sub = stocks.stateChanges().subscribe(data => {
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

  fdescribe('snapshotChanges()', () => {

    it('should listen to all snapshotChanges() by default', async (done) => {

    });

  });

  describe('stateChanges()', () => {
    it('should listen to all stateChanges() by default', async (done) => {
      const randomCollectionName = randomName(afs.firestore);
      const ref = afs.firestore.collection(`${randomCollectionName}`);
      const stocks = new AngularFirestoreCollection<Stock>(ref, ref);
      const ITEMS = 10;
      let count = 0;
      const names = await createRandomStocks(afs.firestore, ref, ITEMS);
      const sub = stocks.stateChanges().subscribe(data => {
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
    
    it('should be able to filter stateChanges() types - modified', async (done) => {
      const randomCollectionName = randomName(afs.firestore);
      const ref = afs.firestore.collection(`${randomCollectionName}`);
      const stocks = new AngularFirestoreCollection<Stock>(ref, ref);
      const ITEMS = 10;
      let count = 0;
      const names = await createRandomStocks(afs.firestore, ref, ITEMS);
      
      const sub = stocks.stateChanges(['modified']).subscribe(data => {
        sub.unsubscribe();
        expect(data.length).toEqual(1);
        expect(data[0].payload.doc.data().price).toEqual(2);
        expect(data[0].type).toEqual('modified');
        deleteThemAll(names, ref).then(done).catch(done.fail);
        done();
      });
  
      delayUpdate(stocks, names[0], { price: 2 });
    });
  
    it('should be able to filter stateChanges() types - added', async (done) => {
      const randomCollectionName = randomName(afs.firestore);
      const ref = afs.firestore.collection(`${randomCollectionName}`);
      const stocks = new AngularFirestoreCollection<Stock>(ref, ref);
      const ITEMS = 10;
      let count = 0;
      let names = await createRandomStocks(afs.firestore, ref, ITEMS);
      
      const sub = stocks.stateChanges(['added']).skip(1).subscribe(data => {
        sub.unsubscribe();
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
  
    it('should be able to filter stateChanges() types - removed', async (done) => {
      const randomCollectionName = randomName(afs.firestore);
      const ref = afs.firestore.collection(`${randomCollectionName}`);
      const stocks = new AngularFirestoreCollection<Stock>(ref, ref);
      const ITEMS = 10;
      let names = await createRandomStocks(afs.firestore, ref, ITEMS);
      
      const sub = stocks.stateChanges(['removed']).subscribe(data => {
        sub.unsubscribe();
        expect(data.length).toEqual(1);
        expect(data[0].type).toEqual('removed');
        deleteThemAll(names, ref).then(done).catch(done.fail);
        done();
      });
  
      delayDelete(stocks, names[0], 400);
    }); 
  }); 

});