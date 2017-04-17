import * as firebase from 'firebase/app';
import { AngularFireDatabase } from './database';
import { AngularFireDatabaseModule } from './database.module';
import { FirebaseListObservable } from './firebase_list_observable';
import { FirebaseListFactory, onChildAdded, onChildChanged, onChildRemoved, onChildUpdated } from './firebase_list_factory';
import { FirebaseObjectFactory } from './firebase_object_factory';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule} from '../angularfire2';
import { TestBed, inject } from '@angular/core/testing';
import * as utils from '../utils';
import { Query, AFUnwrappedDataSnapshot } from '../interfaces';
import { Subscription, Observable, Subject } from 'rxjs';
import { COMMON_CONFIG } from '../test-config';
import { _do } from 'rxjs/operator/do';
import { map } from 'rxjs/operator/map';
import { skip } from 'rxjs/operator/skip';
import { take } from 'rxjs/operator/take';
import { toArray } from 'rxjs/operator/toArray';
import { toPromise } from 'rxjs/operator/toPromise';

const questionsPath = 'questions';

function queryTest(observable: Observable<any>, subject: Subject<any>, done: any) {
  let nexted = false;
  skipAndTake(observable, 2)
    .subscribe(val => {
      if (!nexted) {
        subject.next('2');
      }
      if (nexted) {
        expect(nexted).toBe(true);
        done();
      }
      nexted = true;
    });

  subject.next('20');
}

describe('AngularFireDatabase', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, '[DEFAULT]'),
        AngularFireDatabaseModule
      ]
    });
    inject([FirebaseApp, AngularFireDatabase], (app_: FirebaseApp, _db: AngularFireDatabase) => {
      app = app_;
      db = _db;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  describe('<constructor>', () => {

    it('should accept a Firebase db url in the constructor', () => {
      expect(db instanceof AngularFireDatabase).toBe(true);
    });

  });

});

describe('FirebaseListFactory', () => {

  let app: FirebaseApp;
  let db: AngularFireDatabase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, '[DEFAULT]'),
        AngularFireDatabaseModule
      ]
    });
    inject([FirebaseApp, AngularFireDatabase], (app_: FirebaseApp, _db: AngularFireDatabase) => {
      app = app_;
      db = _db;
    })();
  });


  describe('<constructor>', () => {

    it('should accept a Firebase db ref in the constructor', () => {
      const list = FirebaseListFactory(app.database().ref(`questions`));
      expect(list instanceof FirebaseListObservable).toBe(true);
    });

  });

  describe('query', () => {

    describe('orderByChild', () => {
      /*
        orderByChild combinations
        ----------------------
        orderByChild("").equalTo()
        orderByChild("").startAt()
        orderByChild("").startAt().endAt();
        orderByChild("").endAt();
      */
      it('equalTo - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByChild: 'height',
            equalTo: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('startAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByChild: 'height',
            startAt: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('endAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByChild: 'height',
            endAt: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('should throw an error if limitToLast and limitToFirst are chained', () => {

        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByChild: 'height',
            limitToFirst: 10,
            limitToLast: 100
          }
        });
        expect(observable.subscribe).toThrowError();
      });

      it('should throw an error if startAt is used with equalTo', () => {

        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByChild: 'height',
            equalTo: 10,
            startAt: 100
          }
        });
        expect(observable.subscribe).toThrowError();
      });

      it('should throw an error if endAt is used with equalTo', () => {

        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByChild: 'height',
            equalTo: 10,
            endAt: 100
          }
        });
        expect(observable.subscribe).toThrowError();
      });

      it('should throw an error if startAt and endAt is used with equalTo', () => {

        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByChild: 'height',
            equalTo: 10,
            endAt: 100,
            startAt: 103
          }
        });
        expect(observable.subscribe).toThrowError();
      });

    });

    describe('orderByValue', () => {
      /*
        orderByValue combinations
        ----------------------
        orderByValue("").equalTo()
        orderByValue("").startAt()
        orderByValue("").startAt().endAt();
        orderByValue("").endAt();
      */
      it('equalTo - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByValue: true,
            equalTo: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('startAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByValue: true,
            startAt: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('endAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByValue: true,
            endAt: subject
          }
        });

        queryTest(observable, subject, done);
      });

    });

    describe('orderByKey', () => {
      /*
        orderByKey combinations
        ----------------------
        orderByKey("").equalTo()
        orderByKey("").startAt()
        orderByKey("").startAt().endAt();
        orderByKey("").endAt();
      */
      it('equalTo - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByKey: true,
            equalTo: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('startAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByKey: true,
            startAt: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('endAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByKey: true,
            endAt: subject
          }
        });

        queryTest(observable, subject, done);
      });
    });

    describe('orderByPriority', () => {
      /*
        orderByPriority combinations
        ----------------------
        orderByPriority("").equalTo()
        orderByPriority("").startAt()
        orderByPriority("").startAt().endAt();
        orderByPriority("").endAt();
      */
      it('equalTo - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByKey: true,
            equalTo: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('startAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByKey: true,
            startAt: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('endAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByKey: true,
            endAt: subject
          }
        });

        queryTest(observable, subject, done);
      });
    });

  });

  describe('shape', () => {

    it('should have a a FirebaseListObservable shape when queried', () => {
        const observable = FirebaseListFactory(app.database().ref(questionsPath), {
          query: {
            orderByChild: 'height',
            equalTo: '1'
          }
        });

        expect(observable.push instanceof Function).toBe(true);
        expect(observable.update instanceof Function).toBe(true);
        expect(observable.remove instanceof Function).toBe(true);
    });
  });

  describe('methods', () => {

    let toKey;
    let val1: any;
    let val2: any;
    let val3: any;
    let questions: FirebaseListObservable<any>;
    let questionsSnapshotted: FirebaseListObservable<any>;
    let ref: any;
    let refSnapshotted: any;
    let subscription: Subscription;

    beforeEach((done: any) => {
      toKey = (val) => val.key;
      val1 = { key: 'key1' };
      val2 = { key: 'key2' };
      val3 = { key: 'key3' };
      app.database().ref().remove(done);
      questions = FirebaseListFactory(app.database().ref(`questions`));
      questionsSnapshotted = FirebaseListFactory(app.database().ref(`questionssnapshot`), { preserveSnapshot: true });
      ref = questions.$ref;
      refSnapshotted = questionsSnapshotted.$ref;
    });


    afterEach((done: any) => {
      if (subscription && !subscription.closed) {
        subscription.unsubscribe();
      }
      Promise.all([ref.remove(), refSnapshotted.remove()]).then(done, done.fail);
    });


    it('should emit only when the initial data set has been loaded', (done: any) => {
      questions.$ref.ref.set([{ initial1: true }, { initial2: true }, { initial3: true }, { initial4: true }])
        .then(() => toPromise.call(skipAndTake(questions, 1)))
        .then((val: any[]) => {
          expect(val.length).toBe(4);
        })
        .then(() => {
          done();
        }, done.fail);
    });


    it('should be resistant to non-asynchronous child_added quirks', (done: any) => {

      // If push is called (or set or update, too, I guess) immediately after
      // an on or once listener is added, it appears that the on or once
      // child_added listeners are invoked immediately - i.e. not
      // asynchronously - and the list implementation needs to support that.

      questions.$ref.ref.push({ number: 1 })
        .then(() => {
          let calls = [];
          questions.$ref.ref.once('child_added', (snap) => calls.push('child_added:' + snap.val().number));
          skipAndTake(questions).subscribe(
            (list) => {
              expect(calls).toEqual(['child_added:2', 'pushed']);
              expect(list.map(i => i.number)).toEqual([1, 2]);
              done();
            },
            done.fail
          );
          questions.push({ number: 2 });
          calls.push('pushed');
        })
        .catch(done.fail);
    });


    it('should emit a new value when a child moves', (done: any) => {
     let question = skipAndTake(questions, 1, 2)
     subscription = _do.call(question, (data: any) => {
        expect(data.length).toBe(2);
        expect(data[0].push2).toBe(true);
        expect(data[1].push1).toBe(true);
      })
      .subscribe(() => {
        done();
      }, done.fail);

      let child1 = ref.push({ push1: true }, () => {
        ref.push({ push2: true }, () => {
          child1.setPriority('ZZZZ')
        });
      });
    });


    it('should emit unwrapped data by default', (done: any) => {
      ref.remove(() => {
        ref.push({ unwrapped: true }, () => {
          subscription = _do.call(skipAndTake(questions, 1), (data: any) => {
            expect(data.length).toBe(1);
            expect(data[0].unwrapped).toBe(true);
          })
          .subscribe(() => {
            done();
          }, done.fail);
        });
      });
    });


    it('should emit snapshots if preserveSnapshot option is true', (done: any) => {
      refSnapshotted.push('hello snapshot!', () => {
        subscription = _do.call(skipAndTake(questionsSnapshotted, 1),(data: any) => {
          expect(data[0].val()).toEqual('hello snapshot!');
        })
        .subscribe(() => {
          done();
        }, done.fail);
      });
    });


    it('should re-emit identical instances of unchanged children', (done: any) => {

      let prev;

      take.call(questions, 2).subscribe(
        (list) => {
          if (prev) {
            expect(list[0]).toBe(prev[0]);
            done();
          } else {
            prev = list;
            questions.push({ name: 'bob' });
          }
        },
        done.fail
      );
      questions.push({ name: 'alice' });
    });


    it('should re-emit identical instances of unchanged children as snapshots', (done: any) => {

      let prev;

      take.call(questionsSnapshotted, 2).subscribe(
        (list) => {
          if (prev) {
            expect(list[0]).toBe(prev[0]);
            done();
          } else {
            prev = list;
            questionsSnapshotted.push({ name: 'bob' });
          }
        },
        done.fail
      );
      questionsSnapshotted.push({ name: 'alice' });
    });


    it('should support null for equalTo queries', (done: any) => {

      questions.$ref.ref.set({
        val1,
        val2: Object.assign({}, val2, { extra: true }),
        val3: Object.assign({}, val3, { extra: true }),
      })
      .then(() => {

        let query = FirebaseListFactory(questions.$ref.ref, {
          query: {
            orderByChild: "extra",
            equalTo: null
          }
        });

        take.call(query, 1).subscribe(
          (list) => {
            expect(list.length).toEqual(1);
            expect(list[0].$key).toEqual("val1");
            done();
          },
          done.fail
        );
      });
    });


    it('should support null for startAt/endAt queries', (done: any) => {

      questions.$ref.ref.set({
        val1,
        val2: Object.assign({}, val2, { extra: true }),
        val3: Object.assign({}, val3, { extra: true }),
      })
      .then(() => {

        let query = FirebaseListFactory(questions.$ref.ref, {
          query: {
            orderByChild: "extra",
            startAt: null,
            endAt: null
          }
        });

        take.call(query, 1).subscribe(
          (list) => {
            expect(list.length).toEqual(1);
            expect(list[0].$key).toEqual("val1");
            done();
          },
          done.fail
        );
      });
    });


    it('should call off on all events when disposed', (done: any) => {
      const questionRef = app.database().ref().child('questions');
      let firebaseSpy = spyOn(questionRef, 'off').and.callThrough();
      subscription = FirebaseListFactory(questionRef).subscribe(_ => {
        expect(firebaseSpy).not.toHaveBeenCalled();
        subscription.unsubscribe();
        expect(firebaseSpy).toHaveBeenCalled();
        done();
      });
    });


    describe('onChildAdded', () => {

      it('should add the child after the prevKey', () => {
        expect(onChildAdded([val1, val2], val3, toKey, 'key1')).toEqual([val1, val3, val2]);
      });


      it('should not mutate the input array', () => {
        let inputArr = [val1];
        expect(onChildAdded(inputArr, val2, toKey, 'key1')).not.toEqual(inputArr);
      });
    });


    describe('onChildChanged', () => {

      it('should move the child after the specified prevKey', () => {
        expect(onChildChanged([val1, val2], val1, toKey, 'key2')).toEqual([val2, val1]);
      });


      it('should move the child to the beginning if prevKey is null', () => {
        expect(
          onChildChanged([val1, val2, val3], val2, toKey, null)
        ).toEqual([val2, val1, val3]);
      });

      it('should not duplicate the first item if it is the one that changed', () => {
        expect(
          onChildChanged([val1, val2, val3], val1, toKey, null)
        ).not.toEqual([val1, val1, val2, val3]);
      });

      it('should not mutate the input array', () => {
        let inputArr = [val1, val2];
        expect(onChildChanged(inputArr, val1, toKey, 'key2')).not.toEqual(inputArr);
      });


      it('should update the child', () => {
        expect(
          onChildUpdated([val1, val2, val3], { key: 'newkey' }, toKey, 'key1').map(v => v.key)
        ).toEqual(['key1', 'newkey', 'key3']);
      });
    });


    describe('onChildRemoved', () => {

      it('should remove the child', () => {
        expect(
          onChildRemoved([val1, val2, val3], val2, toKey)
        ).toEqual([val1, val3]);
      });
    });


    describe('utils.unwrapMapFn', () => {
      let val = { unwrapped: true };
      let snapshot = {
        ref: { key: 'key' },
        val: () => val
      };

      it('should return an object value with a $key property', () => {
        const unwrapped = utils.unwrapMapFn(snapshot as firebase.database.DataSnapshot);
        expect(unwrapped.$key).toEqual(snapshot.ref.key);
      });

      it('should return an object value with a $value property if value is scalar', () => {
        const existsFn = () => { return true; }
        const unwrappedValue5 = utils.unwrapMapFn(Object.assign(snapshot, { val: () => 5, exists: existsFn }) as firebase.database.DataSnapshot);
        const unwrappedValueFalse = utils.unwrapMapFn(Object.assign(snapshot, { val: () => false, exists: existsFn }) as firebase.database.DataSnapshot);
        const unwrappedValueLol = utils.unwrapMapFn(Object.assign(snapshot, { val: () => 'lol', exists: existsFn }) as firebase.database.DataSnapshot);

        expect(unwrappedValue5.$key).toEqual('key');
        expect(unwrappedValue5.$value).toEqual(5);
        expect(unwrappedValue5.$exists()).toEqual(true);

        expect(unwrappedValueFalse.$key).toEqual('key');
        expect(unwrappedValueFalse.$value).toEqual(false);
        expect(unwrappedValueFalse.$exists()).toEqual(true);

        expect(unwrappedValueLol.$key).toEqual('key');
        expect(unwrappedValueLol.$value).toEqual('lol');
        expect(unwrappedValueLol.$exists()).toEqual(true);
      });
    });

    it('should emit values in the observable creation zone', (done: any) => {
      Zone.current.fork({
        name: 'newZone'
      })
      .run(() => {
        // Creating a new observable so that the current zone is captured.
        subscription = FirebaseListFactory(app.database().ref(`questions`))
          .filter(d => d
            .map(v => v.$value)
            .indexOf('in-the-zone') > -1)
          .subscribe(data => {
            expect(Zone.current.name).toBe('newZone');
            done();
          });
      });

      ref.remove(() => {
        ref.push('in-the-zone');
      });
    });

    describe('Removing and replacing a child key', () => {
      const firstKey = 'index1';
      const middleKey = 'index2';
      const lastKey = 'index3';
      const initialData = {
        [firstKey]: true,
        [middleKey]: true,
        [lastKey]: true,
      };
      let keyToRemove: string;

      afterEach((done: any) => {
        subscription = questions
          .skip(2)
          .take(1)
          .subscribe((items: any[]) => {
            expect(items.length).toBe(3);
            done();
          }, done.fail);
        questions.$ref.ref.set(initialData)
          .then(() => ref.child(keyToRemove).remove())
          .then(() => ref.child(keyToRemove).set(true));
      });

      it('should work with the first item in the list', () => {
        keyToRemove = firstKey;
      });

      it('should work with the middle item in the list', () => {
        keyToRemove = middleKey;
      });

      it('should work with the last item in the list', () => {
        keyToRemove = lastKey;
      });
    });

    describe('startAt(value, key)', () => {

      it('should support the optional key parameter to startAt', (done) => {

        questions.$ref.ref.set({
          val1: Object.assign({}, val1, { data: 0 }),
          val2: Object.assign({}, val2, { data: 0 }),
          val3: Object.assign({}, val3, { data: 0 })
        })
        .then(() => {

          let query1 = FirebaseListFactory(app.database().ref(`questions`), {
            query: {
              orderByChild: 'data',
              startAt: { value: 0 }
            }
          });
          let promise1 = toPromise.call(take.call(query1, 1));

          let query2 = FirebaseListFactory(app.database().ref(`questions`), {
            query: {
              orderByChild: 'data',
              startAt: { value: 0, key: 'val2' }
            }
          });
          let promise2 = toPromise.call(take.call(query2, 1));

          Promise.all([promise1, promise2]).then(([list1, list2]) => {
            expect(list1.map(i => i.$key)).toEqual(['val1', 'val2', 'val3']);
            expect(list2.map(i => i.$key)).toEqual(['val2', 'val3']);
            done();
          });
        })
        .catch(done.fail);
      });

    });

    describe('equalTo(value, key)', () => {

      it('should support the optional key parameter to equalTo', (done) => {

        questions.$ref.ref.set({
          val1: Object.assign({}, val1, { data: 0 }),
          val2: Object.assign({}, val2, { data: 0 }),
          val3: Object.assign({}, val3, { data: 0 })
        })
        .then(() => {

          let query1 = FirebaseListFactory(app.database().ref(`questions`), {
            query: {
              orderByChild: 'data',
              equalTo: { value: 0 }
            }
          });
          let promise1 = toPromise.call(take.call(query1, 1));

          let query2 = FirebaseListFactory(app.database().ref(`questions`), {
            query: {
              orderByChild: 'data',
              equalTo: { value: 0, key: 'val2' }
            }
          });
          let promise2 = toPromise.call(take.call(query2, 1));

          Promise.all([promise1, promise2]).then(([list1, list2]) => {
            expect(list1.map(i => i.$key)).toEqual(['val1', 'val2', 'val3']);
            expect(list2.map(i => i.$key)).toEqual(['val2']);
            done();
          });
        })
        .catch(done.fail);
      });

    });

    describe('endAt(value, key)', () => {

      it('should support the optional key parameter to endAt', (done) => {

        questions.$ref.ref.set({
          val1: Object.assign({}, val1, { data: 0 }),
          val2: Object.assign({}, val2, { data: 0 }),
          val3: Object.assign({}, val3, { data: 0 })
        })
        .then(() => {

          let query1 = FirebaseListFactory(app.database().ref(`questions`), {
            query: {
              orderByChild: 'data',
              endAt: { value: 0 }
            }
          });
          let promise1 = toPromise.call(take.call(query1, 1));

          let query2 = FirebaseListFactory(app.database().ref(`questions`), {
            query: {
              orderByChild: 'data',
              endAt: { value: 0, key: 'val2' }
            }
          });
          let promise2 = toPromise.call(take.call(query2, 1));

          Promise.all([promise1, promise2]).then(([list1, list2]) => {
            expect(list1.map(i => i.$key)).toEqual(['val1', 'val2', 'val3']);
            expect(list2.map(i => i.$key)).toEqual(['val1', 'val2']);
            done();
          });
        })
        .catch(done.fail);
      });

    });

    describe('observable queries (issue #830)', () => {

      it('should not emit the results of previous queries', (done) => {

        questions.$ref.ref.set({
          key1: { even: false, value: 1 },
          key2: { even: true, value: 2 }
        })
        .then(() => {

          let subject = new Subject<boolean>();
          let query = FirebaseListFactory(app.database().ref(`questions`), {
            query: {
              orderByChild: 'even',
              equalTo: subject
            }
          });

          query = map.call(query, (list, index) => {
            switch (index) {
            case 0:
              subject.next(true);
              break;
            case 1:
              questions.$ref.ref.update({
                key3: { even: false, value: 3 },
                key4: { even: true, value: 4 }
              });
              break;
            default:
              break;
            }
            return list;
          });
          query = take.call(query, 3);
          query = toArray.call(query);

          toPromise.call(query).then((emits) => {
            expect(emits.map(e => e.map(i => i.$key))).toEqual([
              ['key1'],
              ['key2'],
              ['key2', 'key4']
            ]);
            done();
          });

          subject.next(false);
        })
        .catch(done.fail);
      });

    });

  });
});

function skipAndTake<T>(obs: Observable<T>, takeCount: number = 1, skipCount: number = 0) {
  return take.call(skip.call(obs, skipCount), takeCount);
}
