import {Observable} from 'rxjs/Observable';
import {Operator} from 'rxjs/Operator';
import {Subscriber} from 'rxjs/Subscriber';
import {Subscription} from 'rxjs/Subscription';

export class FirebaseListObservable<T> extends Observable<T> {
  constructor(subscribe?: <R>(subscriber: Subscriber<R>) => Subscription | Function | void, private _ref?:Firebase) {
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

  remove(item:string | Firebase | FirebaseDataSnapshot | AFUnwrappedDataSnapshot): Promise<FirebaseDataSnapshot> {
    // TODO: remove override when typings are updated to include
    // remove() returning a promise.
    if (typeof item === 'string') {
      return (<any>this._ref).child(item).remove();
    } else if (item instanceof Firebase) {
      // Firebase ref
      return (<any>item).remove();
    } else if (typeof (<any>item).key === 'function') {
      // Snapshot
      return (<any>(<FirebaseDataSnapshot>item).ref().remove());
    } else if (typeof (<any>item).$key === 'string') {
      // Unwrapped snapshot
      return (<any>this._ref).child((<AFUnwrappedDataSnapshot>item).$key).remove();
    }
    throw new Error(`FirebaseListObservable.remove requires a key, snapshot, reference, or unwrapped snapshot. Got: ${typeof item}`);
  }
}

export interface AFUnwrappedDataSnapshot {
  $key: string;
  $value?: string | number | boolean;
}
