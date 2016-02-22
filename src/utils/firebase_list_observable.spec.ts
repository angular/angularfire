import {describe,it,beforeEach} from 'angular2/testing';
import {FirebaseListObservable} from './firebase_list_observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/map';
import * as Firebase from 'firebase';

const rootUrl = 'ws://localhost.firebaseio.test:5000';

describe('FirebaseObservable', () => {
  it('should return an instance of FirebaseObservable when calling operators', () => {
    var O:FirebaseListObservable<number> = new FirebaseListObservable((observer:Observer<number>) => {
    });
    expect(O.map(noop) instanceof FirebaseListObservable).toBe(true);
  });


  describe('add', () => {
    it('should throw an exception if pushed when not subscribed', () => {
      var O:FirebaseListObservable<any> = new FirebaseListObservable((observer:Observer<any>) => {});

      expect(() => {
        O.add('foo');
      }).toThrowError('No ref specified for this Observable!')
    });


    it('should call push on the underlying ref', () => {
      var fbref = new Firebase(rootUrl);
      var pushSpy = spyOn(fbref, 'push');
      var O:FirebaseListObservable<any> = new FirebaseListObservable((observer:Observer<any>) => {
      }, fbref);

      O.subscribe();

      O.add(1);

      expect(pushSpy).toHaveBeenCalledWith(1);
    });


    it('should accept any type of value without compilation error', () => {
      var O:FirebaseListObservable<any> = new FirebaseListObservable((observer:Observer<any>) => {
      }, new Firebase(rootUrl));

      O.add('foo');
    });
  });
});

function noop() {}
