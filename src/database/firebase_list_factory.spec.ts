import * as firebase from 'firebase';
import {
  FirebaseListFactory,
  FirebaseListObservable,
  FirebaseObjectFactory,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onChildUpdated,
} from './index';
import {
  FIREBASE_PROVIDERS,
  defaultFirebase,
  FirebaseApp,
  FirebaseAppConfig,
  AngularFire,
  AngularFireModule
} from '../angularfire2';
import {
  TestBed,
  inject
} from '@angular/core/testing';
import * as utils from '../utils';
import { Query, AFUnwrappedDataSnapshot } from '../interfaces';
import { Subscription, Observable, Subject } from 'rxjs';
import { COMMON_CONFIG, ANON_AUTH_CONFIG } from '../test-config';
import { _do } from 'rxjs/operator/do';
import { skip } from 'rxjs/operator/skip';
import { take } from 'rxjs/operator/take';
import { toPromise } from 'rxjs/operator/toPromise';

const rootDatabaseUrl = COMMON_CONFIG.databaseURL;

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

describe('FirebaseListFactory', () => {

  var app: firebase.app.App;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(COMMON_CONFIG, ANON_AUTH_CONFIG, '[DEFAULT]')]
    });
    inject([FirebaseApp, AngularFire], (firebaseApp: firebase.app.App, _af: AngularFire) => {
      app = firebaseApp;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  describe('constructor', () => {

    it('should accept a Firebase db url in the constructor', () => {
      const list = FirebaseListFactory(`${rootDatabaseUrl}/questions`);
      expect(list instanceof FirebaseListObservable).toBe(true);
    });

    it('should accept a Firebase db ref in the constructor', () => {
      const list = FirebaseListFactory(firebase.database().refFromURL(`${rootDatabaseUrl}/questions`));
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
        const observable = FirebaseListFactory(rootDatabaseUrl, {
          query: {
            orderByChild: 'height',
            equalTo: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('startAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(rootDatabaseUrl, {
          query: {
            orderByChild: 'height',
            startAt: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('endAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(rootDatabaseUrl, {
          query: {
            orderByChild: 'height',
            endAt: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('should throw an error if limitToLast and limitToFirst are chained', () => {

        const observable = FirebaseListFactory(rootDatabaseUrl, {
          query: {
            orderByChild: 'height',
            limitToFirst: 10,
            limitToLast: 100
          }
        });
        expect(observable.subscribe).toThrowError();
      });

      it('should throw an error if startAt is used with equalTo', () => {

        const observable = FirebaseListFactory(rootDatabaseUrl, {
          query: {
            orderByChild: 'height',
            equalTo: 10,
            startAt: 100
          }
        });
        expect(observable.subscribe).toThrowError();
      });

      it('should throw an error if endAt is used with equalTo', () => {

        const observable = FirebaseListFactory(rootDatabaseUrl, {
          query: {
            orderByChild: 'height',
            equalTo: 10,
            endAt: 100
          }
        });
        expect(observable.subscribe).toThrowError();
      });

      it('should throw an error if startAt and endAt is used with equalTo', () => {

        const observable = FirebaseListFactory(rootDatabaseUrl, {
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
        const observable = FirebaseListFactory(rootDatabaseUrl, {
          query: {
            orderByValue: true,
            equalTo: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('startAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(rootDatabaseUrl, {
          query: {
            orderByValue: true,
            startAt: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('endAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(rootDatabaseUrl, {
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
        const observable = FirebaseListFactory(rootDatabaseUrl, {
          query: {
            orderByKey: true,
            equalTo: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('startAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(rootDatabaseUrl, {
          query: {
            orderByKey: true,
            startAt: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('endAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(rootDatabaseUrl, {
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
        const observable = FirebaseListFactory(rootDatabaseUrl, {
          query: {
            orderByKey: true,
            equalTo: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('startAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(rootDatabaseUrl, {
          query: {
            orderByKey: true,
            startAt: subject
          }
        });

        queryTest(observable, subject, done);
      });

      it('endAt - should re-run a query when the observable value has emitted', (done: any) => {

        const subject = new Subject();
        const observable = FirebaseListFactory(rootDatabaseUrl, {
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
        const observable = FirebaseListFactory(rootDatabaseUrl, {
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

    var toKey;
    var val1: any;
    var val2: any;
    var val3: any;
    var questions: FirebaseListObservable<any>;
    var questionsSnapshotted: FirebaseListObservable<any>;
    var ref: any;
    var refSnapshotted: any;
    var subscription: Subscription;

    beforeEach((done: any) => {
      toKey = (val) => val.key;
      val1 = { key: 'key1' };
      val2 = { key: 'key2' };
      val3 = { key: 'key3' };
      firebase.database().ref().remove(done);
      questions = FirebaseListFactory(`${rootDatabaseUrl}/questions`);
      questionsSnapshotted = FirebaseListFactory(`${rootDatabaseUrl}/questionssnapshot`, { preserveSnapshot: true });
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

      var child1 = ref.push({ push1: true }, () => {
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


    it('should call off on all events when disposed', (done: any) => {
      const questionRef = firebase.database().ref().child('questions');
      var firebaseSpy = spyOn(questionRef, 'off').and.callThrough();
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
        var inputArr = [val1];
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
        var inputArr = [val1, val2];
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
      var val = { unwrapped: true };
      var snapshot = {
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
        subscription = FirebaseListFactory(`${rootDatabaseUrl}/questions`)
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
  });
});

function skipAndTake<T>(obs: Observable<T>, takeCount: number = 1, skipCount: number = 0) {
  return take.call(skip.call(obs, skipCount), takeCount);
}
