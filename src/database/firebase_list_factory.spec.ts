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
  var subscription: Subscription;
  var questions: FirebaseListObservable<any>;
  var questionsSnapshotted: FirebaseListObservable<any>;
  var ref: any;
  var refSnapshotted: any;
  var val1: any;
  var val2: any;
  var val3: any;
  var app: firebase.app.App;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(COMMON_CONFIG, ANON_AUTH_CONFIG)]
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

    beforeEach((done: any) => {
      val1 = { key: 'key1' };
      val2 = { key: 'key2' };
      val3 = { key: 'key3' };
      firebase.database().ref().remove(done);
      questions = FirebaseListFactory(`${rootDatabaseUrl}/questions`);
      questionsSnapshotted = FirebaseListFactory(`${rootDatabaseUrl}/questionssnapshot`, { preserveSnapshot: true });
      ref = (<any>questions).$ref;
      refSnapshotted = (<any>questionsSnapshotted).$ref;
    });

    afterEach((done: any) => {
      if (subscription && !subscription.closed) {
        subscription.unsubscribe();
      }
      Promise.all([ref.remove(), refSnapshotted.remove()]).then(done, done.fail);
    });


    it('should emit only when the initial data set has been loaded', (done: any) => {
      (<any>questions).$ref.set([{ initial1: true }, { initial2: true }, { initial3: true }, { initial4: true }])
        .then(() => toPromise.call(skipAndTake(questions, 1)))
        .then((val: any[]) => {
          expect(val.length).toBe(4);
        })
        .then(() => {
          done();
        }, done.fail);
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


    it('should call off on all events when disposed', () => {
      const questionRef = firebase.database().ref().child('questions');
      var firebaseSpy = spyOn(questionRef, 'off').and.callThrough();
      subscription = FirebaseListFactory(questionRef).subscribe();
      expect(firebaseSpy).not.toHaveBeenCalled();
      subscription.unsubscribe();
      expect(firebaseSpy).toHaveBeenCalled();
    });


    describe('onChildAdded', () => {
      it('should add the child after the prevKey', () => {
        expect(onChildAdded([val1, val2], val3, 'key1')).toEqual([val1, val3, val2]);
      });


      it('should not mutate the input array', () => {
        var inputArr = [val1];
        expect(onChildAdded(inputArr, val2, 'key1')).not.toEqual(inputArr);
      });
    });


    describe('onChildChanged', () => {
      it('should move the child after the specified prevKey', () => {
        expect(onChildChanged([val1, val2], val1, 'key2')).toEqual([val2, val1]);
      });


      it('should move the child to the beginning if prevKey is null', () => {
        expect(
          onChildChanged([val1, val2, val3], val2, null)
        ).toEqual([val2, val1, val3]);
      });

      it('should not duplicate the first item if it is the one that changed', () => {
        expect(
          onChildChanged([val1, val2, val3], val1, null)
        ).not.toEqual([val1, val1, val2, val3]);
      });

      it('should not mutate the input array', () => {
        var inputArr = [val1, val2];
        expect(onChildChanged(inputArr, val1, 'key2')).not.toEqual(inputArr);
      });


      it('should update the child', () => {
        expect(
          onChildUpdated([val1, val2, val3], { key: 'newkey' }, 'key1').map(v => v.key)
        ).toEqual(['key1', 'newkey', 'key3']);
      });
    });


    describe('onChildRemoved', () => {
      var val1: any;
      var val2: any;
      var val3: any;

      beforeEach(() => {
        val1 = { key: () => 'key1' };
        val2 = { key: () => 'key2' };
        val3 = { key: () => 'key3' };
      });


      it('should remove the child', () => {
        expect(
          onChildRemoved([val1, val2, val3], val2)
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

  });
});

function skipAndTake<T>(obs: Observable<T>, takeCount: number = 1, skipCount: number = 0) {
  return take.call(skip.call(obs, skipCount), takeCount);
}
