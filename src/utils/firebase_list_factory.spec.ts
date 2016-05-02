declare var require: any;
import {
  FirebaseListFactory,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onChildUpdated,
  unwrapMapFn
} from './firebase_list_factory';
import {FirebaseListObservable} from './firebase_list_observable';
import {FirebaseObjectFactory} from './firebase_object_factory';
import {
  beforeEach,
  it,
  iit,
  ddescribe,
  describe,
  expect
} from 'angular2/testing';
import {Query} from './query_observable';
import {Subscription, Observable, Subject} from 'rxjs';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/take';

const rootFirebase = 'https://angularfire2-list-factory.firebaseio-demo.com/';

function queryTest(observable: Observable<any>, subject: Subject<any>, done: any) {
  let nexted = false;
  observable
    .take(2)
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

  describe('constructor', () => {

    it('should accept a Firebase db url in the constructor', () => {
      const list = FirebaseListFactory(`${rootFirebase}/questions`);
      expect(list).toBeAnInstanceOf(FirebaseListObservable);
    });

    it('should accept a Firebase db ref in the constructor', () => {
      const list = FirebaseListFactory(new Firebase(`${rootFirebase}/questions`));
      expect(list).toBeAnInstanceOf(FirebaseListObservable);
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
        const observable = FirebaseListFactory(rootFirebase, {
          query: {
            orderByChild: 'height',
            equalTo: subject
          }
        });
        
        queryTest(observable, subject, done);
      });
                         
      it('startAt - should re-run a query when the observable value has emitted', (done: any) => {
        
        const subject = new Subject();
        const observable = FirebaseListFactory(rootFirebase, {
          query: {
            orderByChild: 'height',
            startAt: subject
          }
        });
        
        queryTest(observable, subject, done);
      });      

      it('endAt - should re-run a query when the observable value has emitted', (done: any) => {
        
        const subject = new Subject();
        const observable = FirebaseListFactory(rootFirebase, {
          query: {
            orderByChild: 'height',
            endAt: subject
          }
        });
        
        queryTest(observable, subject, done);
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
        const observable = FirebaseListFactory(rootFirebase, {
          query: {
            orderByValue: true,
            equalTo: subject
          }
        });
        
        queryTest(observable, subject, done);
      });
                         
      it('startAt - should re-run a query when the observable value has emitted', (done: any) => {
        
        const subject = new Subject();
        const observable = FirebaseListFactory(rootFirebase, {
          query: {
            orderByValue: true,
            startAt: subject
          }
        });
        
        queryTest(observable, subject, done);
      });      

      it('endAt - should re-run a query when the observable value has emitted', (done: any) => {
        
        const subject = new Subject();
        const observable = FirebaseListFactory(rootFirebase, {
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
        const observable = FirebaseListFactory(rootFirebase, {
          query: {
            orderByKey: true,
            equalTo: subject
          }
        });
        
        queryTest(observable, subject, done);
      });
                         
      it('startAt - should re-run a query when the observable value has emitted', (done: any) => {
        
        const subject = new Subject();
        const observable = FirebaseListFactory(rootFirebase, {
          query: {
            orderByKey: true,
            startAt: subject
          }
        });
        
        queryTest(observable, subject, done);
      });      

      it('endAt - should re-run a query when the observable value has emitted', (done: any) => {
        
        const subject = new Subject();
        const observable = FirebaseListFactory(rootFirebase, {
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
        const observable = FirebaseListFactory(rootFirebase, {
          query: {
            orderByKey: true,
            equalTo: subject
          }
        });
        
        queryTest(observable, subject, done);
      });
                         
      it('startAt - should re-run a query when the observable value has emitted', (done: any) => {
        
        const subject = new Subject();
        const observable = FirebaseListFactory(rootFirebase, {
          query: {
            orderByKey: true,
            startAt: subject
          }
        });
        
        queryTest(observable, subject, done);
      });      

      it('endAt - should re-run a query when the observable value has emitted', (done: any) => {
        
        const subject = new Subject();
        const observable = FirebaseListFactory(rootFirebase, {
          query: {
            orderByKey: true,
            endAt: subject
          }
        });
        
        queryTest(observable, subject, done);
      });             
    });    
    
  });

  describe('methods', () => {

    beforeEach((done: any) => {
      val1 = { key: () => 'key1' };
      val2 = { key: () => 'key2' };
      val3 = { key: () => 'key3' };
      (new Firebase(rootFirebase)).remove(done);
      questions = FirebaseListFactory(`${rootFirebase}/questions`);
      questionsSnapshotted = FirebaseListFactory(`${rootFirebase}/questionssnapshot`, { preserveSnapshot: true });
      ref = (<any>questions)._ref;
      refSnapshotted = (<any>questionsSnapshotted)._ref;
    });

    afterEach((done: any) => {
      if (subscription && !subscription.isUnsubscribed) {
        subscription.unsubscribe();
      }
      Promise.all([ref.remove(), refSnapshotted.remove()]).then(done, done.fail);
    });


    it('should emit only when the initial data set has been loaded', (done: any) => {
      
      (<any>questions)._ref.set([{ initial1: true }, { initial2: true }, { initial3: true }, { initial4: true }])
        .then(() => questions.take(1).toPromise())
        .then((val: any[]) => {
          expect(val.length).toBe(4);
        })
        .then(() => {
          done();
        }, done.fail);
    });


    it('should emit a new value when a child moves', (done: any) => {
      subscription = questions
        .skip(2)
        .take(1)
        .do((data: any) => {
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
          subscription = questions
            .take(1)
            .do((data: any) => {
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
        subscription = questionsSnapshotted
          .take(1)
          .do((data: any) => {
            expect(data[0].val()).toEqual('hello snapshot!');
          })
          .subscribe(() => {
            done();
          }, done.fail);
      });
    });


    it('should call off on all events when disposed', () => {
      var firebaseSpy = spyOn(Firebase.prototype, 'off').and.callThrough();
      subscription = FirebaseListFactory(rootFirebase).subscribe();
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


      it('should not mutate the input array', () => {
        var inputArr = [val1, val2];
        expect(onChildChanged(inputArr, val1, 'key2')).not.toEqual(inputArr);
      });


      it('should update the child', () => {
        expect(
          onChildUpdated([val1, val2, val3], {
            key: () => 'newkey'
          }, 'key1').map(v => v.key())
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


    describe('unwrapMapFn', () => {
      var val = { unwrapped: true };
      var snapshot = {
        key: () => 'key',
        val: () => val
      };

      it('should return an object value with a $key property', () => {
        expect(unwrapMapFn(snapshot as FirebaseDataSnapshot)).toEqual({
          $key: 'key',
          unwrapped: true
        });
      });


      it('should return an object value with a $value property if value is scalar', () => {
        expect(unwrapMapFn(Object.assign(snapshot, { val: () => 5 }) as FirebaseDataSnapshot)).toEqual({
          $key: 'key',
          $value: 5
        });
        expect(unwrapMapFn(Object.assign(snapshot, { val: () => false }) as FirebaseDataSnapshot)).toEqual({
          $key: 'key',
          $value: false
        });
        expect(unwrapMapFn(Object.assign(snapshot, { val: () => 'lol' }) as FirebaseDataSnapshot)).toEqual({
          $key: 'key',
          $value: 'lol'
        });
      });
    });

  });
});
