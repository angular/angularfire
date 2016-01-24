import {describe,it,beforeEach} from 'angular2/testing';
import {FirebaseObservable} from './firebase_observable';
import {Observer} from 'rxjs/Observer';

describe('FirebaseObservable', () => {
  it('should return an instance of FirebaseObservable when calling operators', () => {
    var O:FirebaseObservable<number> = new FirebaseObservable((observer:Observer<number>) => {
    });
    expect(O.map(noop) instanceof FirebaseObservable).toBe(true);
  });
});

function noop() {}