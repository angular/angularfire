import {FirebaseListFactory,
onChildAdded,
onChildChanged,
onChildRemoved,
onChildUpdated} from '../utils/firebase_list_factory';

import {beforeEach, it, describe, expect} from 'angular2/testing';

const rootFirebase = 'ws://test.firebaseio.com:5000';

describe('FirebaseListFactory', () => {
  it('should emit a new value when a child moves', () => {
    var ref = new Firebase(`${rootFirebase}/questions`);
    var o = FirebaseListFactory(`${rootFirebase}/questions`);
    var nextSpy = jasmine.createSpy('next');
    o.subscribe(nextSpy);
    expect(nextSpy.calls.count()).toBe(0);

    var child1 = ref.push(1);
    expect(nextSpy.calls.count()).toBe(1);

    ref.push(2);
    expect(nextSpy.calls.count()).toBe(2);

    child1.setPriority('ZZZZ');
    expect(nextSpy.calls.count()).toBe(3);
    expect(
      nextSpy.calls.mostRecent().args[0].map((v: any) => v.val())
    ).toEqual([2, 1]);
  });


  it('should call off on all events when disposed', () => {
    var firebaseSpy = spyOn(Firebase.prototype, 'off');
    var subscribed = FirebaseListFactory('ws://test.firebaseio.com:5000').subscribe();
    expect(firebaseSpy).not.toHaveBeenCalled();
    subscribed.unsubscribe();
    expect(firebaseSpy).toHaveBeenCalled();
  });
});

describe('onChildAdded', () => {
  it('should add the child to the end of the array', () => {
    expect(onChildAdded([1], 2)).toEqual([1, 2]);
  });


  it('should not mutate the input array', () => {
    var inputArr = [1];
    expect(onChildAdded(inputArr, 2)).not.toEqual(inputArr);
  });
});


describe('onChildChanged', () => {
  var val1: any;
  var val2: any;
  var val3: any;
  beforeEach(() => {
    val1 = { key: () => 'key1' };
    val2 = { key: () => 'key2' };
    val3 = { key: () => 'key3' };
  });


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