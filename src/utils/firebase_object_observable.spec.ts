import {describe,it,beforeEach} from 'angular2/testing';
import {FirebaseObjectObservable} from './firebase_object_observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/map';
import * as Firebase from 'firebase';

const rootUrl = 'ws://localhost.firebaseio.test:5000';

describe('FirebaseObservable', () => {
  it('should return an instance of FirebaseObservable when calling operators', () => {
    var O:FirebaseObjectObservable<number> = new FirebaseObjectObservable((observer:Observer<number>) => {
    });
    expect(O.map(noop) instanceof FirebaseObjectObservable).toBe(true);
  });
});

function noop() {}
