import {Observable} from 'rxjs/Observable';
import {Operator} from 'rxjs/Operator';
import {Subscriber} from 'rxjs/Subscriber';
import {Subscription} from 'rxjs/Subscription';

export type FirebaseOperation = string | Firebase | FirebaseDataSnapshot | AFUnwrappedDataSnapshot

export interface FirebaseOperationCases {
  stringCase: () => Promise<void>;
  firebaseCase?: () => Promise<void>;
  snapshotCase?: () => Promise<void>;
  unwrappedSnapshotCase?: () => Promise<void>;
}

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

  push(val:any):FirebaseWithPromise<void> {
    if(!this._ref) {
      throw new Error('No ref specified for this Observable!');
    }
    return this._ref.push(val);
  }
  
  update(item: FirebaseOperation, value: Object): Promise<void> {
    return this._checkOperationCases(item, {
      stringCase: () => this._ref.child(<string>item).update(value),
      firebaseCase: () => (<Firebase>item).update(value),
      snapshotCase: () => (<FirebaseDataSnapshot>item).ref().update(value),
      unwrappedSnapshotCase: () => this._ref.child((<AFUnwrappedDataSnapshot>item).$key).update(value)
    });
  }

  remove(item:FirebaseOperation = null): Promise<void> {
    // TODO: remove override when typings are updated to include
    // remove() returning a promise.
    
    // if no item parameter is provided, remove the whole list
    if (!item) {
      return this._ref.remove();
    }
    return this._checkOperationCases(item, {
      stringCase: () => this._ref.child(<string>item).remove(),
      firebaseCase: () => (<Firebase>item).remove(),
      snapshotCase: () => (<FirebaseDataSnapshot>item).ref().remove(),
      unwrappedSnapshotCase: () => this._ref.child((<AFUnwrappedDataSnapshot>item).$key).remove()
    });
  }
  
  _checkOperationCases(item: FirebaseOperation, cases: FirebaseOperationCases) : Promise<void> {
    if (typeof item === 'string') {
      return cases.stringCase();
    } else if (item instanceof Firebase) {
      // Firebase ref
      return cases.firebaseCase();
    } else if (typeof (<any>item).key === 'function') {
      // Snapshot
      return cases.snapshotCase();
    } else if (typeof (<any>item).$key === 'string') {
      // Unwrapped snapshot
      return cases.unwrappedSnapshotCase()
    }
    throw new Error(`FirebaseListObservable.remove requires a key, snapshot, reference, or unwrapped snapshot. Got: ${typeof item}`);
  }
  
}

export interface AFUnwrappedDataSnapshot {
  $key: string;
  $value?: string | number | boolean;
}
