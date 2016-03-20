declare var require:any;
import {
  FirebaseListFactory,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onChildUpdated,
  unwrapMapFn
} from './firebase_list_factory';
import {FirebaseListObservable} from './firebase_list_observable';
import {
  beforeEach,
  it,
  iit,
  ddescribe,
  describe,
  expect
} from 'angular2/testing';
import {Subscription} from 'rxjs';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/take';

const rootFirebase = 'ws://localhost.firebaseio.test:5000';

describe('FirebaseListFactory', () => {
  var subscription:Subscription;
  var questions:FirebaseListObservable<any>;
  var questionsSnapshotted:FirebaseListObservable<any>;
  var ref:any;
  var refSnapshotted:any;
  var val1: any;
  var val2: any;
  var val3: any;

  beforeEach((done:any) => {
    val1 = { key: () => 'key1' };
    val2 = { key: () => 'key2' };
    val3 = { key: () => 'key3' };
    (new Firebase(rootFirebase)).remove(done);
    questions = FirebaseListFactory(`${rootFirebase}/questions`);
    questionsSnapshotted = FirebaseListFactory(`${rootFirebase}/questionssnapshot`, {preserveSnapshot: true});
    ref = (<any>questions)._ref;
    refSnapshotted = (<any>questionsSnapshotted)._ref;
  });

  afterEach((done:any) => {
    if (subscription && !subscription.isUnsubscribed) {
      subscription.unsubscribe();
    }
    Promise.all([ref.remove(), refSnapshotted.remove()]).then(done, done.fail);
  });


  it('should emit only when the initial data set has been loaded', (done:any) => {
    // TODO: Fix Firebase server event order. srsly
    // Use set to populate and erase previous values
    // Populate with mutliple values to see the initial data load
    (<any>questions)._ref.set([{initial1:true}, {initial2:true}, {initial3:true}, {initial4:true}])
      .then(() => questions.take(1).toPromise())
      .then((val:any[]) => {
        expect(val.length).toBe(4);
      })
      .then(() => {
        done();
      }, done.fail);
  });


  it('should emit a new value when a child moves', (done:any) => {
    subscription = questions
      .skip(2)
      .take(1)
      .do((data:any) => {
        expect(data.length).toBe(2);
        expect(data[0].push2).toBe(true);
        expect(data[1].push1).toBe(true);
      })
      .subscribe(() => {
        done();
      }, done.fail);

    var child1 = ref.push({push1:true}, () => {
      ref.push({push2:true}, () => {
        child1.setPriority('ZZZZ')
      });
    });
  });


  it('should emit unwrapped data by default', (done:any) => {
    ref.remove(() => {
      ref.push({unwrapped: true}, () => {
        subscription = questions
          .take(1)
          .do((data:any) => {
            expect(data.length).toBe(1);
            expect(data[0].unwrapped).toBe(true);
          })
          .subscribe(() => {
            done();
          }, done.fail);
      });
    });
  });


  it('should emit snapshots if preserveSnapshot option is true', (done:any) => {
    refSnapshotted.push('hello snapshot!', () => {
      subscription = questionsSnapshotted
        .take(1)
        .do((data:any) => {
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
    var val = {unwrapped: true};
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
      expect(unwrapMapFn(Object.assign(snapshot, {val: () => 5}) as FirebaseDataSnapshot)).toEqual({
        $key: 'key',
        $value: 5
      });
      expect(unwrapMapFn(Object.assign(snapshot, {val: () => false}) as FirebaseDataSnapshot)).toEqual({
        $key: 'key',
        $value: false
      });
      expect(unwrapMapFn(Object.assign(snapshot, {val: () => 'lol'}) as FirebaseDataSnapshot)).toEqual({
        $key: 'key',
        $value: 'lol'
      });
    });
  });
});
