import {FirebaseObjectFactory} from '../utils/firebase_object_factory';
import {FirebaseObjectObservable} from '../utils/firebase_object_observable';
import {beforeEach, it, describe, expect} from 'angular2/testing';
import {Subscription} from 'rxjs';

const rootFirebase = 'ws://localhost.firebaseio.test:5000';

describe('FirebaseObjectFactory', () => {
  var ref = new Firebase(`${rootFirebase}/questions/1`);
  var observable:FirebaseObjectObservable<any>;
  var subscription:Subscription;
  var nextSpy:jasmine.Spy;

  beforeEach((done:any) => {
    nextSpy = nextSpy = jasmine.createSpy('next');
    observable = FirebaseObjectFactory(`${rootFirebase}/questions/1`);
    ref.remove(done);
    if (subscription && !subscription.isUnsubscribed) {
      subscription.unsubscribe();
    }
  });


  it('should emit a null value if no value is present when subscribed', () => {
    subscription = observable.subscribe(nextSpy);
    expect(nextSpy.calls.count()).toBe(1);
    expect(nextSpy.calls.argsFor(0)[0]).toEqual(null);
  });


  it('should emit unwrapped data by default', () => {
    ref.set({foo: 'bar'});
    subscription = observable.subscribe(nextSpy);
    expect(nextSpy.calls.argsFor(0)[0]).toEqual({foo: 'bar'});
  });


  it('should emit snapshots if preserveSnapshot option is true', () => {
    observable = FirebaseObjectFactory(`${rootFirebase}/questions/1`, {preserveSnapshot: true});
    ref.set('hello!');
    subscription = observable.subscribe(nextSpy);
    expect(nextSpy.calls.argsFor(0)[0].val()).toEqual('hello!');
  });


  it('should call off on all events when disposed', () => {
    var firebaseSpy = spyOn(Firebase.prototype, 'off');
    subscription = FirebaseObjectFactory(rootFirebase).subscribe();
    expect(firebaseSpy).not.toHaveBeenCalled();
    subscription.unsubscribe();
    expect(firebaseSpy).toHaveBeenCalled();
  });
});
