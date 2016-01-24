import {Observable} from 'rxjs/Observable';
import {Operator} from 'rxjs/Operator';

export class FirebaseObservable<T> extends Observable<T> {
  private _ref:Firebase;
  lift<T, R>(operator: Operator<T, R>): Observable<R> {
    const observable = new FirebaseObservable<R>();
    observable.source = this;
    observable.operator = operator;
    return observable;
  }
}