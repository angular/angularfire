import {Observable} from 'rxjs/Observable';
import {Operator} from 'rxjs/Operator';
import {Subscriber} from 'rxjs/Subscriber';
import {Subscription} from 'rxjs/Subscription';
import * as utils from './utils';

export interface FirebaseOperationCases {
  stringCase: () => firebase.Promise<void>;
  firebaseCase?: () => firebase.Promise<void>;
  snapshotCase?: () => firebase.Promise<void>;
  unwrappedSnapshotCase?: () => firebase.Promise<void>;
}

export interface AFUnwrappedDataSnapshot {
  $key: string;
  $value?: string | number | boolean;
}

export type FirebaseOperation = string | firebase.database.Reference | firebase.database.DataSnapshot | AFUnwrappedDataSnapshot;

export class FirebaseListObservable<T> extends Observable<T> {
  constructor(public _ref: firebase.database.Reference | firebase.database.Query, subscribe?: <R>(subscriber: Subscriber<R>) => Subscription | Function | void) {
    super(subscribe);
  }
  lift<T, R>(operator: Operator<T, R>): Observable<R> {
    const observable = new FirebaseListObservable<R>(this._ref);
    observable.source = this;
    observable.operator = operator;
    observable._ref = this._ref;
    return observable;
  }

  push(val:any):firebase.database.ThenableReference {
    if(!this._ref) {
      throw new Error('No ref specified for this Observable!');
    }
    this._ref.ref
    return this._ref.ref.push(val);
  }

  update(item: FirebaseOperation, value: Object): firebase.Promise<void> {
    return this._checkOperationCases(item, {
      stringCase: () => this._ref.ref.child(<string>item).update(value),
      firebaseCase: () => (<firebase.database.Reference>item).update(value),
      snapshotCase: () => (<firebase.database.DataSnapshot>item).ref.update(value),
      unwrappedSnapshotCase: () => this._ref.ref.child((<AFUnwrappedDataSnapshot>item).$key).update(value)
    });
  }

  remove(item:FirebaseOperation = null): firebase.Promise<void> {
    // TODO: remove override when typings are updated to include
    // remove() returning a promise.

    // if no item parameter is provided, remove the whole list
    if (!item) {
      return this._ref.ref.remove();
    }
    return this._checkOperationCases(item, {
      stringCase: () => this._ref.ref.child(<string>item).remove(),
      firebaseCase: () => (<firebase.database.Reference>item).remove(),
      snapshotCase: () => (<firebase.database.DataSnapshot>item).ref.remove(),
      unwrappedSnapshotCase: () => this._ref.ref.child((<AFUnwrappedDataSnapshot>item).$key).remove()
    });
  }

  _checkOperationCases(item: FirebaseOperation, cases: FirebaseOperationCases) : firebase.Promise<void> {
    if (utils.isString(item)) {
      return cases.stringCase();
    } else if (utils.isFirebaseRef(item)) {
      // Firebase ref
      return cases.firebaseCase();
    } else if (utils.isFirebaseDataSnapshot(item)) {
      // Snapshot
      return cases.snapshotCase();
    } else if (utils.isAFUnwrappedSnapshot(item)) {
      // Unwrapped snapshot
      return cases.unwrappedSnapshotCase()
    }
    throw new Error(`FirebaseListObservable.remove requires a key, snapshot, reference, or unwrapped snapshot. Got: ${typeof item}`);
  }

}
