import {Observable} from 'rxjs/Observable';
import {Operator} from 'rxjs/Operator';
import {Subscriber} from 'rxjs/Subscriber';
import {Subscription} from 'rxjs/Subscription';

export class FirebaseListObservable<T> extends Observable<T> {
  constructor(subscribe?: <R>(subscriber: Subscriber<R>) => Subscription<T> | Function | void, private _ref?:Firebase) {
    super(subscribe);
  }
  lift<T, R>(operator: Operator<T, R>): Observable<R> {
    const observable = new FirebaseListObservable<R>();
    observable.source = this;
    observable.operator = operator;
    observable._ref = this._ref;
    return observable;
  }

  add(val:any):void {
    if(!this._ref) {
      // _ref gets created when the observable is subscribed
      throw new Error('No ref specified for this Observable!');
    }
    this._ref.push(val);
  }
}
