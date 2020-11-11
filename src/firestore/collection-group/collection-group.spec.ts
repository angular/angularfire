import { AngularFireModule, FirebaseApp } from '@angular/fire';
import { AngularFirestore, AngularFirestoreCollectionGroup, AngularFirestoreModule, SETTINGS } from '../public_api';
import { Query, QueryGroupFn } from '../interfaces';
import { BehaviorSubject } from 'rxjs';
import { skip, switchMap, take } from 'rxjs/operators';
import { TestBed } from '@angular/core/testing';
import { COMMON_CONFIG } from '../../test-config';
import 'firebase/firestore';

import {
  createRandomStocks,
  delayAdd,
  delayDelete,
  delayUpdate,
  deleteThemAll,
  FAKE_STOCK_DATA,
  rando,
  randomName,
  Stock
} from '../utils.spec';

async function collectionHarness(afs: AngularFirestore, items: number, queryGroupFn?: QueryGroupFn) {
  const randomCollectionName = randomName(afs.firestore);
  const ref = afs.firestore.collection(`${randomCollectionName}`);
  const firestore: any = afs.firestore;
  const collectionGroup: Query = firestore.collectionGroup(randomCollectionName);
  const queryFn = queryGroupFn || (ref => ref);
  const stocks = new AngularFirestoreCollectionGroup<Stock>(queryFn(collectionGroup), afs);
  const names = await createRandomStocks(afs.firestore, ref, items);
  return { randomCollectionName, ref, stocks, names };
}

describe('AngularFirestoreCollectionGroup', () => {
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
      const ITEMS = 4;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);

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

    it('should handle multiple subscriptions (hot)', async (done: any) => {
      const ITEMS = 4;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);
      const changes = stocks.valueChanges();
      const sub = changes.subscribe(() => {
      }).add(
        changes.pipe(take(1)).subscribe(data => {
          expect(data.length).toEqual(ITEMS);
          sub.unsubscribe();
        })
      ).add(() => {
        deleteThemAll(names, ref).then(done).catch(done.fail);
      });
    });

    it('should handle multiple subscriptions (warm)', async (done: any) => {
      const ITEMS = 4;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);
      const changes = stocks.valueChanges();
      changes.pipe(take(1)).subscribe(() => {
      }).add(() => {
        changes.pipe(take(1)).subscribe(data => {
          expect(data.length).toEqual(ITEMS);
        }).add(() => {
          deleteThemAll(names, ref).then(done).catch(done.fail);
        });
      });
    });

    it('should handle dynamic queries that return empty sets', async (done) => {
      const ITEMS = 10;
      let count = 0;

      const pricefilter$ = new BehaviorSubject<number | null>(null);
      const randomCollectionName = randomName(afs.firestore);
      const ref = afs.firestore.collection(`${randomCollectionName}`);
      const names = await createRandomStocks(afs.firestore, ref, ITEMS);
      const sub = pricefilter$.pipe(switchMap(price => {
        return afs.collection(randomCollectionName, ref => price ? ref.where('price', '==', price) : ref).valueChanges();
      })).subscribe(data => {
        count = count + 1;
        // the first time should all be 'added'
        if (count === 1) {
          expect(data.length).toEqual(ITEMS);
          pricefilter$.next(-1);
        }
        // on the second round, we should have filtered out everything
        if (count === 2) {
          expect(data.length).toEqual(0);
          sub.unsubscribe();
          deleteThemAll(names, ref).then(done).catch(done.fail);
        }
      });
    });

    it('should return the document\'s id along with the data if the idField option is provided.', async () => {
      const ITEMS = 4;
      const DOC_ID = 'docId';
      const { stocks } = await collectionHarness(afs, ITEMS);

      const sub = stocks.valueChanges({idField: DOC_ID}).subscribe(data => {
        const allDocumentsHaveId = data.every(d => d.docId !== undefined);

        expect(allDocumentsHaveId).toBe(true);
        sub.unsubscribe();
      });
    });

  });

  describe('snapshotChanges()', () => {

    it('should listen to all snapshotChanges() by default', async (done) => {
      const ITEMS = 10;
      let count = 0;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);
      const sub = stocks.snapshotChanges().subscribe(data => {
        count = count + 1;
        // the first time should all be 'added'
        if (count === 1) {
          // make an update
          ref.doc(names[0]).update({ price: 2 });
        }
        // on the second round, make sure the array is still the same
        // length but the updated item is now modified
        if (count === 2) {
          expect(data.length).toEqual(ITEMS);
          const change = data.filter(x => x.payload.doc.id === names[0])[0];
          expect(change.type).toEqual('modified');
          sub.unsubscribe();
          deleteThemAll(names, ref).then(done).catch(done.fail);
        }
      });
    });

    it('should handle multiple subscriptions (hot)', async (done: any) => {
      const ITEMS = 4;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);
      const changes = stocks.snapshotChanges();
      const sub = changes.subscribe(() => {
      }).add(
        changes.pipe(take(1)).subscribe(data => {
          expect(data.length).toEqual(ITEMS);
          sub.unsubscribe();
        })
      ).add(() => {
        deleteThemAll(names, ref).then(done).catch(done.fail);
      });
    });

    it('should handle multiple subscriptions (warm)', async (done: any) => {
      const ITEMS = 4;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);
      const changes = stocks.snapshotChanges();
      changes.pipe(take(1)).subscribe(() => {
      }).add(() => {
        changes.pipe(take(1)).subscribe(data => {
          expect(data.length).toEqual(ITEMS);
        }).add(() => {
          deleteThemAll(names, ref).then(done).catch(done.fail);
        });
      });
    });

    it('should update order on queries', async (done) => {
      const ITEMS = 10;
      let count = 0;
      let firstIndex = 0;
      const { ref, stocks, names } =
        await collectionHarness(afs, ITEMS, ref => ref.orderBy('price', 'desc'));
      const sub = stocks.snapshotChanges().subscribe(data => {
        count = count + 1;
        // the first time should all be 'added'
        if (count === 1) {
          // make an update
          firstIndex = data.filter(d => d.payload.doc.id === names[0])[0].payload.newIndex;
          ref.doc(names[0]).update({ price: 2 });
        }
        // on the second round, make sure the array is still the same
        // length but the updated item is now modified
        if (count === 2) {
          expect(data.length).toEqual(ITEMS);
          const change = data.filter(x => x.payload.doc.id === names[0])[0];
          expect(change.type).toEqual('modified');
          expect(change.payload.oldIndex).toEqual(firstIndex);
          sub.unsubscribe();
          deleteThemAll(names, ref).then(done).catch(done.fail);
        }
      });
    });

    it('should be able to filter snapshotChanges() types - modified', async (done) => {
      const ITEMS = 10;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);

      const sub = stocks.snapshotChanges(['modified']).pipe(skip(1)).subscribe(data => {
        sub.unsubscribe();
        const change = data.filter(x => x.payload.doc.id === names[0])[0];
        expect(data.length).toEqual(1);
        expect(change.payload.doc.data().price).toEqual(2);
        expect(change.type).toEqual('modified');
        deleteThemAll(names, ref).then(done).catch(done.fail);
      });

      delayUpdate(ref, names[0], { price: 2 });
    });

    it('should be able to filter snapshotChanges() types - added', async (done) => {
      const ITEMS = 10;
      const harness = await collectionHarness(afs, ITEMS);
      const { randomCollectionName, ref, stocks } = harness;
      let { names } = harness;
      const nextId = ref.doc('a').id;

      const sub = stocks.snapshotChanges(['added']).pipe(skip(1)).subscribe(data => {
        sub.unsubscribe();
        const change = data.filter(x => x.payload.doc.id === nextId)[0];
        expect(data.length).toEqual(ITEMS + 1);
        expect(change.payload.doc.data().price).toEqual(2);
        expect(change.type).toEqual('added');
        deleteThemAll(names, ref).then(done).catch(done.fail);
        done();
      });


      names = names.concat([nextId]);
      // TODO these two add tests are the only one really testing collection-group queries
      //      should flex more, maybe split the stocks between more than one collection
      delayAdd(ref.doc(names[0]).collection(randomCollectionName), nextId, { price: 2 });
    });

    it('should be able to filter snapshotChanges() types - added w/same id', async (done) => {
      const ITEMS = 10;
      const { randomCollectionName, ref, stocks, names } = await collectionHarness(afs, ITEMS);

      const sub = stocks.snapshotChanges(['added']).pipe(skip(1)).subscribe(data => {
        sub.unsubscribe();
        const change = data.filter(x => x.payload.doc.id === names[0])[1];
        expect(data.length).toEqual(ITEMS + 1);
        expect(change.payload.doc.data().price).toEqual(3);
        expect(change.type).toEqual('added');
        ref.doc(names[0]).collection(randomCollectionName).doc(names[0]).delete()
          .then(() => deleteThemAll(names, ref))
          .then(done).catch(done.fail);
        done();
      });

      delayAdd(ref.doc(names[0]).collection(randomCollectionName), names[0], { price: 3 });
    });

    it('should be able to filter snapshotChanges() types - added/modified', async (done) => {
      const ITEMS = 10;

      const harness = await collectionHarness(afs, ITEMS);
      const { ref, stocks } = harness;
      let { names } = harness;

      const nextId = ref.doc('a').id;
      let count = 0;

      stocks.snapshotChanges(['added', 'modified']).pipe(skip(1), take(2)).subscribe(data => {
        count += 1;
        if (count === 1) {
          const change = data.filter(x => x.payload.doc.id === nextId)[0];
          expect(data.length).toEqual(ITEMS + 1);
          expect(change.payload.doc.data().price).toEqual(2);
          expect(change.type).toEqual('added');
          delayUpdate(ref, names[0], { price: 2 });
        }
        if (count === 2) {
          const change = data.filter(x => x.payload.doc.id === names[0])[0];
          expect(data.length).toEqual(ITEMS + 1);
          expect(change.payload.doc.data().price).toEqual(2);
          expect(change.type).toEqual('modified');
        }
      }).add(() => {
        deleteThemAll(names, ref).then(done).catch(done.fail);
      });

      names = names.concat([nextId]);
      delayAdd(ref, nextId, { price: 2 });
    });

    it('should be able to filter snapshotChanges() types - removed', async (done) => {
      const ITEMS = 10;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);

      const sub = stocks.snapshotChanges(['added', 'removed']).pipe(skip(1)).subscribe(data => {
        sub.unsubscribe();
        const change = data.filter(x => x.payload.doc.id === names[0]);
        expect(data.length).toEqual(ITEMS - 1);
        expect(change.length).toEqual(0);
        deleteThemAll(names, ref).then(done).catch(done.fail);
        done();
      });

      delayDelete(ref, names[0], 400);
    });

  });

  describe('stateChanges()', () => {

    it('should get stateChanges() updates', async (done: any) => {
      const ITEMS = 10;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);

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

    it('should listen to all stateChanges() by default', async (done) => {
      const ITEMS = 10;
      let count = 0;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);
      stocks.stateChanges().subscribe(data => {
        count = count + 1;
        if (count === 1) {
          ref.doc(names[0]).update({ price: 2 });
        }
        if (count === 2) {
          expect(data.length).toEqual(1);
          expect(data[0].type).toEqual('modified');
          deleteThemAll(names, ref).then(done).catch(done.fail);
        }
      });
    });

    it('should handle multiple subscriptions (hot)', async (done: any) => {
      const ITEMS = 4;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);
      const changes = stocks.stateChanges();
      const sub = changes.subscribe(() => {
      }).add(
        changes.pipe(take(1)).subscribe(data => {
          expect(data.length).toEqual(ITEMS);
          sub.unsubscribe();
        })
      ).add(() => {
        deleteThemAll(names, ref).then(done).catch(done.fail);
      });
    });

    it('should handle multiple subscriptions (warm)', async (done: any) => {
      const ITEMS = 4;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);
      const changes = stocks.stateChanges();
      changes.pipe(take(1)).subscribe(() => {
      }).add(() => {
        changes.pipe(take(1)).subscribe(data => {
          expect(data.length).toEqual(ITEMS);
        }).add(() => {
          deleteThemAll(names, ref).then(done).catch(done.fail);
        });
      });
    });

    it('should be able to filter stateChanges() types - modified', async (done) => {
      const ITEMS = 10;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);

      const sub = stocks.stateChanges(['modified']).subscribe(data => {
        sub.unsubscribe();
        expect(data.length).toEqual(1);
        expect(data[0].payload.doc.data().price).toEqual(2);
        expect(data[0].type).toEqual('modified');
        deleteThemAll(names, ref).then(done).catch(done.fail);
        done();
      });

      delayUpdate(ref, names[0], { price: 2 });
    });

    it('should be able to filter stateChanges() types - added', async (done) => {
      const ITEMS = 10;

      const harness = await collectionHarness(afs, ITEMS);
      const { ref, stocks } = harness;
      let { names } = harness;


      const sub = stocks.stateChanges(['added']).pipe(skip(1)).subscribe(data => {
        sub.unsubscribe();
        expect(data.length).toEqual(1);
        expect(data[0].payload.doc.data().price).toEqual(2);
        expect(data[0].type).toEqual('added');
        deleteThemAll(names, ref).then(done).catch(done.fail);
        done();
      });

      const nextId = ref.doc('a').id;
      names = names.concat([nextId]);
      delayAdd(ref, nextId, { price: 2 });
    });

    it('should be able to filter stateChanges() types - removed', async (done) => {
      const ITEMS = 10;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);

      const sub = stocks.stateChanges(['removed']).subscribe(data => {
        sub.unsubscribe();
        expect(data.length).toEqual(1);
        expect(data[0].type).toEqual('removed');
        deleteThemAll(names, ref).then(done).catch(done.fail);
        done();
      });

      delayDelete(ref, names[0], 400);
    });
  });

  describe('auditTrail()', () => {
    it('should listen to all events for auditTrail() by default', async (done) => {
      const ITEMS = 10;
      let count = 0;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);
      const sub = stocks.auditTrail().subscribe(data => {
        count = count + 1;
        if (count === 1) {
          ref.doc(names[0]).update({ price: 2 });
        }
        if (count === 2) {
          sub.unsubscribe();
          expect(data.length).toEqual(ITEMS + 1);
          expect(data[data.length - 1].type).toEqual('modified');
          deleteThemAll(names, ref).then(done).catch(done.fail);
        }
      });
    });

    it('should be able to filter auditTrail() types - removed', async (done) => {
      const ITEMS = 10;
      const { ref, stocks, names } = await collectionHarness(afs, ITEMS);

      const sub = stocks.auditTrail(['removed']).subscribe(data => {
        sub.unsubscribe();
        expect(data.length).toEqual(1);
        expect(data[0].type).toEqual('removed');
        deleteThemAll(names, ref).then(done).catch(done.fail);
        done();
      });

      delayDelete(ref, names[0], 400);
    });
  });

});
