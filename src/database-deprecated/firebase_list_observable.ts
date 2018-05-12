import { Observable, Operator, Subscriber, Subscription } from 'rxjs';
import { Reference, DataSnapshot, ThenableReference } from '@firebase/database-types';
import * as utils from './utils';
import { AFUnwrappedDataSnapshot, FirebaseOperationCases, QueryReference, DatabaseSnapshot, DatabaseReference } from './interfaces';

export type FirebaseOperation = string | Reference | DataSnapshot | AFUnwrappedDataSnapshot;

export class FirebaseListObservable<T> extends Observable<T> {
  constructor(public $ref: QueryReference, subscribe?: <R>(subscriber: Subscriber<R>) => Subscription | Function | void) {
    super(subscribe);
  }
  lift<T, R>(operator: Operator<T, R>): Observable<R> {
    const observable = new FirebaseListObservable<R>(this.$ref);
    observable.source = this;
    observable.operator = operator;
    observable.$ref = this.$ref;
    return observable;
  }

  push(val:any):ThenableReference {
    if(!this.$ref) {
      throw new Error('No ref specified for this Observable!');
    }
    return this.$ref.ref.push(val);
  }

  set(item: FirebaseOperation, value: Object): Promise<void> {
    return this._checkOperationCases(item, {
      stringCase: () => this.$ref.ref.child(<string>item).set(value),
      firebaseCase: () => (<Reference>item).set(value),
      snapshotCase: () => (<DataSnapshot>item).ref.set(value),
      unwrappedSnapshotCase: () => this.$ref.ref.child((<AFUnwrappedDataSnapshot>item).$key).set(value)
    });
  }

  update(item: FirebaseOperation, value: Object): Promise<void> {
    return this._checkOperationCases(item, {
      stringCase: () => this.$ref.ref.child(<string>item).update(value),
      firebaseCase: () => (<Reference>item).update(value),
      snapshotCase: () => (<DataSnapshot>item).ref.update(value),
      unwrappedSnapshotCase: () => this.$ref.ref.child((<AFUnwrappedDataSnapshot>item).$key).update(value)
    });
  }

  remove(item?:FirebaseOperation): Promise<void> {
    // if no item parameter is provided, remove the whole list
    if (!item) {
      return this.$ref.ref.remove();
    }
    return this._checkOperationCases(item, {
      stringCase: () => this.$ref.ref.child(<string>item).remove(),
      firebaseCase: () => (<DatabaseReference>item).remove(),
      snapshotCase: () => (<DatabaseSnapshot>item).ref.remove(),
      unwrappedSnapshotCase: () => this.$ref.ref.child((<AFUnwrappedDataSnapshot>item).$key).remove()
    });
  }

  protected _checkOperationCases(item: FirebaseOperation, cases: FirebaseOperationCases) : Promise<void> {
    if (utils.isString(item)) {
      return cases.stringCase();
    } else if (utils.isFirebaseRef(item)) {
      return cases.firebaseCase!();
    } else if (utils.isFirebaseDataSnapshot(item)) {
      return cases.snapshotCase!();
    } else if (utils.isAFUnwrappedSnapshot(item)) {
      return cases.unwrappedSnapshotCase!()
    }
    throw new Error(`Method requires a key, snapshot, reference, or unwrapped snapshot. Got: ${typeof item}`);
  }

}
