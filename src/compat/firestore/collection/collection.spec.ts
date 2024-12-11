import { TestBed } from '@angular/core/testing';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreModule, CollectionReference, QueryFn, USE_EMULATOR } from '@angular/fire/compat/firestore';
import { BehaviorSubject } from 'rxjs';
import { skip, switchMap, take } from 'rxjs/operators';
import { COMMON_CONFIG, firestoreEmulatorPort } from '../../../../src/test-config';
import { rando } from '../../../../src/utils';
import {
  FAKE_STOCK_DATA,
  Stock,
  createRandomStocks,
  delayAdd,
  delayDelete,
  delayUpdate,
  randomName
} from '../utils.spec';

import 'firebase/compat/firestore';

async function collectionHarness(afs: AngularFirestore, items: number, queryFn?: QueryFn<Stock>) {
  const randomCollectionName = randomName(afs.firestore);
  const ref = afs.firestore.collection(`${randomCollectionName}`) as CollectionReference<Stock>;
  if (!queryFn) {
    queryFn = (ref) => ref;
  }
  const stocks = new AngularFirestoreCollection<Stock>(ref, queryFn(ref), afs);
  const names = await createRandomStocks(afs.firestore, ref, items);
  return { randomCollectionName, ref, stocks, names };
}

describe('AngularFirestoreCollection', () => {
  let afs: AngularFirestore;

  beforeEach(() => {
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
        const ITEMS = 4;
        const { stocks } = await collectionHarness(afs, ITEMS);

        const sub = TestBed.runInInjectionContext(() => stocks.valueChanges()).subscribe(data => {
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
          done();
        });
      })();
    });

    /* FLAKE? timing out
        it('should optionally map the doc ID to the emitted data object', done => {
          const ITEMS = 1;
          const { ref, stocks, names } = await collectionHarness(afs, ITEMS);
          const idField = 'myCustomID';
          const sub = stocks.valueChanges({idField}).subscribe(data => {
            sub.unsubscribe();
            const stock = data[0];
            expect(stock[idField]).toBeDefined();
            expect(stock).toEqual(jasmine.objectContaining(FAKE_STOCK_DATA));
            deleteThemAll(names, ref).then(done).catch(fail);
          })
        });*/

    it('should handle multiple subscriptions (hot)', done => {
      (async () => {
        const ITEMS = 4;
        const { stocks } = await collectionHarness(afs, ITEMS);
        const changes = TestBed.runInInjectionContext(() => stocks.valueChanges());
        const sub = changes.subscribe(() => undefined);
        sub.add(
          changes.pipe(take(1)).subscribe(data => {
            expect(data.length).toEqual(ITEMS);
            sub.unsubscribe();
            done();
          })
        );
      })();
    });

    it('should handle multiple subscriptions (warm)', done => {
      (async () => {
        const ITEMS = 4;
        const { stocks } = await collectionHarness(afs, ITEMS);
        const changes = TestBed.runInInjectionContext(() => stocks.valueChanges());
        changes.pipe(take(1)).subscribe(() => undefined).add(() => {
          changes.pipe(take(1)).subscribe(data => {
            expect(data.length).toEqual(ITEMS);
            done();
          });
        });
      })();
    });

    it('should handle dynamic queries that return empty sets', done => {
      (async () => {
        const ITEMS = 10;
        let count = 0;

        const pricefilter$ = new BehaviorSubject<number | null>(null);
        const randomCollectionName = randomName(afs.firestore);
        const ref = afs.firestore.collection(`${randomCollectionName}`);
        await createRandomStocks(afs.firestore, ref, ITEMS);
        const sub = pricefilter$.pipe(switchMap(price => {
          return TestBed.runInInjectionContext(() => afs.collection(randomCollectionName, ref => price ? ref.where('price', '==', price) : ref).valueChanges());
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
            done();
          }
        });
      })();
    });

  });

  describe('snapshotChanges()', () => {

    it('should listen to all snapshotChanges() by default', done => {
      (async () => {
        const ITEMS = 10;
        let count = 0;
        const { stocks } = await collectionHarness(afs, ITEMS);
        const sub = TestBed.runInInjectionContext(() => stocks.snapshotChanges()).subscribe(data => {
          count = count + 1;
          // the first time should all be 'added'
          if (count === 1) {
            // make an update
            stocks.doc(names[0]).update({ price: 2 });
          }
          // on the second round, make sure the array is still the same
          // length but the updated item is now modified
          if (count === 2) {
            expect(data.length).toEqual(ITEMS);
            const change = data.filter(x => x.payload.doc.id === names[0])[0];
            expect(change.type).toEqual('modified');
            sub.unsubscribe();
            done();
          }
        });
      })();
    });

    it('should handle multiple subscriptions (hot)', done => {
      async function setup() {
        const ITEMS = 4;
        const { stocks } = await collectionHarness(afs, ITEMS);
        const changes$ = TestBed.runInInjectionContext(() => stocks.snapshotChanges());
        const sub = changes$.subscribe(() => undefined);
        sub.add(
          changes$.pipe(take(1)).subscribe(data => {
            expect(data.length).toEqual(ITEMS);
            sub.unsubscribe();
            done();
          })
        );
      }
      setup()
    });

    it('should handle multiple subscriptions (warm)', done => {
      (async () => {
        const ITEMS = 4;
        const { stocks } = await collectionHarness(afs, ITEMS);
        const changes = TestBed.runInInjectionContext(() => stocks.snapshotChanges());
        changes.pipe(take(1)).subscribe(() => undefined).add(() => {
          changes.pipe(take(1)).subscribe(data => {
            expect(data.length).toEqual(ITEMS);
            done();
          });
        });
      })();
    });

    it('should update order on queries', done => {
      (async () => {
        const ITEMS = 10;
        let count = 0;
        let firstIndex = 0;
        const { stocks, names } =
          await collectionHarness(afs, ITEMS, ref => ref.orderBy('price', 'desc'));
        const sub = TestBed.runInInjectionContext(() => stocks.snapshotChanges()).subscribe(data => {
          count = count + 1;
          // the first time should all be 'added'
          if (count === 1) {
            // make an update
            firstIndex = data.filter(d => d.payload.doc.id === names[0])[0].payload.newIndex;
            stocks.doc(names[0]).update({ price: 2 });
          }
          // on the second round, make sure the array is still the same
          // length but the updated item is now modified
          if (count === 2) {
            expect(data.length).toEqual(ITEMS);
            const change = data.filter(x => x.payload.doc.id === names[0])[0];
            expect(change.type).toEqual('modified');
            expect(change.payload.oldIndex).toEqual(firstIndex);
            sub.unsubscribe();
            done();
          }
        });
      })();
    });

    it('should be able to filter snapshotChanges() types - modified', done => {
      pending("TODO(jamesdaniels) find out why this is flaking with SDK v11");
      (async () => {
        const ITEMS = 10;
        const { stocks, names } = await collectionHarness(afs, ITEMS);

        const sub = TestBed.runInInjectionContext(() => stocks.snapshotChanges(['modified'])).pipe(skip(1)).subscribe(data => {
          sub.unsubscribe();
          const change = data.filter(x => x.payload.doc.id === names[0])[0];
          expect(data.length).toEqual(1);
          expect(change.payload.doc.data().price).toEqual(2);
          expect(change.type).toEqual('modified');
          done();
        });

        delayUpdate(stocks, names[0], { price: 2 });
      })();
    });

    it('should be able to filter snapshotChanges() types - added', done => {
      (async () => {
        const ITEMS = 10;
        const { ref, stocks } = await collectionHarness(afs, ITEMS);

        const nextId = ref.doc('a').id;

        const sub = TestBed.runInInjectionContext(() => stocks.snapshotChanges(['added'])).pipe(skip(1)).subscribe(data => {
          sub.unsubscribe();
          const change = data.filter(x => x.payload.doc.id === nextId)[0];
          expect(data.length).toEqual(ITEMS + 1);
          expect(change.payload.doc.data().price).toEqual(2);
          expect(change.type).toEqual('added');
          done();
        });

        delayAdd(stocks, nextId, { price: 2 });
      })();
    });

    /* TODO(jamesdaniels): revisit this now that we have metadata
    it('should be able to filter snapshotChanges() types - added/modified', done => {
      (async () => {
        const ITEMS = 10;
        const harness = await collectionHarness(afs, ITEMS);
        const { ref, stocks } = harness;
        let names = harness.names;

        const nextId = ref.doc('a').id;
        let count = 0;

        stocks.snapshotChanges(['added', 'modified']).pipe(skip(1), take(2)).subscribe(data => {
          count += 1;
          if (count === 1) {
            const change = data.filter(x => x.payload.doc.id === nextId)[0];
            expect(data.length).toEqual(ITEMS + 1);
            expect(change.payload.doc.data().price).toEqual(2);
            expect(change.type).toEqual('added');
            delayUpdate(stocks, names[0], { price: 2 });
          }
          if (count === 2) {
            const change = data.filter(x => x.payload.doc.id === names[0])[0];
            expect(data.length).toEqual(ITEMS + 1);
            expect(change.payload.doc.data().price).toEqual(2);
            expect(change.type).toEqual('modified');
          }
        }).add(() => {
          deleteThemAll(names, ref)
              .then(() => {
                done()
              })
              .catch(() => {
                done.fail()
              });
        });

        names = names.concat([nextId]);
        delayAdd(stocks, nextId, { price: 2 });
      })();
    });
    */

    it('should be able to filter snapshotChanges() types - removed', done => {
      (async () => {
        const ITEMS = 10;
        const { stocks, names } = await collectionHarness(afs, ITEMS);

        const sub = TestBed.runInInjectionContext(() => stocks.snapshotChanges(['added', 'removed'])).pipe(skip(1)).subscribe(data => {
          sub.unsubscribe();
          const change = data.filter(x => x.payload.doc.id === names[0]);
          expect(data.length).toEqual(ITEMS - 1);
          expect(change.length).toEqual(0);
          done();
        });

        delayDelete(stocks, names[0], 400);
      })();
    });

  });

  describe('stateChanges()', () => {

    it('should get stateChanges() updates', done => {
      (async () => {
        const ITEMS = 10;
        const { stocks } = await collectionHarness(afs, ITEMS);

        const sub = TestBed.runInInjectionContext(() => stocks.stateChanges()).subscribe(data => {
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
          done();
        });
      })();
    });

    it('should listen to all stateChanges() by default', done => {
      (async () => {
        const ITEMS = 10;
        let count = 0;
        const { stocks, names } = await collectionHarness(afs, ITEMS);
        TestBed.runInInjectionContext(() => stocks.stateChanges()).subscribe(data => {
          count = count + 1;
          if (count === 1) {
            stocks.doc(names[0]).update({ price: 2 });
          }
          if (count === 2) {
            expect(data.length).toEqual(1);
            expect(data[0].type).toEqual('modified');
            done();
          }
        });
      })();
    });

    it('should handle multiple subscriptions (hot)', done => {
      (async () => {
        const ITEMS = 4;
        const { stocks } = await collectionHarness(afs, ITEMS);
        const changes = TestBed.runInInjectionContext(() => stocks.stateChanges());
        const sub = changes.subscribe(() => undefined);
        sub.add(
          changes.pipe(take(1)).subscribe(data => {
            expect(data.length).toEqual(ITEMS);
            sub.unsubscribe();
            done();
          })
        );
      })();
    });

    it('should handle multiple subscriptions (warm)', done => {
      (async () => {
        const ITEMS = 4;
        const { stocks } = await collectionHarness(afs, ITEMS);
        const changes = TestBed.runInInjectionContext(() => stocks.stateChanges());
        changes.pipe(take(1)).subscribe(() => undefined).add(() => {
          changes.pipe(take(1)).subscribe(data => {
            expect(data.length).toEqual(ITEMS);
            done();
          });
        });
      })();
    });

    it('should be able to filter stateChanges() types - modified', done => {
      pending("TODO(jamesdaniels) find out why this is flaking with SDK v11");
      (async () => {
        const ITEMS = 10;
        const { stocks, names } = await collectionHarness(afs, ITEMS);

        const sub = TestBed.runInInjectionContext(() => stocks.stateChanges(['modified'])).pipe(skip(1), take(1)).subscribe(data => {
          sub.unsubscribe();
          expect(data.length).toEqual(1);
          expect(data[0].payload.doc.data().price).toEqual(2);
          expect(data[0].type).toEqual('modified');
          done();
        });

        delayUpdate(stocks, names[0], { price: 2 });
      })();
    });

    it('should be able to filter stateChanges() types - added', done => {
      (async () => {
        const ITEMS = 10;

        const { ref, stocks } = await collectionHarness(afs, ITEMS);
        
        const sub = TestBed.runInInjectionContext(() => stocks.stateChanges(['added'])).pipe(skip(1)).subscribe(data => {
          sub.unsubscribe();
          expect(data.length).toEqual(1);
          expect(data[0].payload.doc.data().price).toEqual(2);
          expect(data[0].type).toEqual('added');
          done();
        });

        const nextId = ref.doc('a').id;
        delayAdd(stocks, nextId, { price: 2 });
      })();
    });

    it('should be able to filter stateChanges() types - removed', done => {
      (async () => {
        const ITEMS = 10;
        const { stocks, names } = await collectionHarness(afs, ITEMS);

        const sub = TestBed.runInInjectionContext(() => stocks.stateChanges(['removed'])).pipe(skip(1), take(1)).subscribe(data => {
          sub.unsubscribe();
          expect(data.length).toEqual(1);
          expect(data[0].type).toEqual('removed');
          done();
        });

        delayDelete(stocks, names[0], 400);
      })();
    });

    it('stateChanges() should emit on empty collection', done => {
      TestBed.runInInjectionContext(() => afs.collection('EMPTY_COLLECTION').stateChanges()).pipe(take(1)).subscribe(data => {
        expect(data.length).toEqual(0);
        done();
      });
    });

    it('stateChanges() w/filter should emit on empty collection', done => {
      TestBed.runInInjectionContext(() => afs.collection('EMPTY_COLLECTION').stateChanges(['added'])).pipe(take(1)).subscribe(data => {
        expect(data.length).toEqual(0);
        done();
      });
    });

  });

  describe('auditTrail()', () => {
    it('should listen to all events for auditTrail() by default', done => {
      (async () => {
        const ITEMS = 10;
        let count = 0;
        const { stocks, names } = await collectionHarness(afs, ITEMS);
        const sub =TestBed.runInInjectionContext(() => stocks.auditTrail()).subscribe(data => {
          count = count + 1;
          if (count === 1) {
            stocks.doc(names[0]).update({ price: 2 });
          }
          if (count === 2) {
            sub.unsubscribe();
            expect(data.length).toEqual(ITEMS + 1);
            expect(data[data.length - 1].type).toEqual('modified');
            done();
          }
        });
      })();
    });

    it('should be able to filter auditTrail() types - removed', done => {
      (async () => {
        const ITEMS = 10;
        const { stocks, names } = await collectionHarness(afs, ITEMS);

        const sub = TestBed.runInInjectionContext(() => stocks.auditTrail(['removed'])).pipe(skip(1), take(1)).subscribe(data => {
          sub.unsubscribe();
          expect(data.length).toEqual(1);
          expect(data[0].type).toEqual('removed');
          done();
        });

        delayDelete(stocks, names[0], 400);
      })();
    });
  });

});
