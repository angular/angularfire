import { Observable } from 'rxjs/Observable';
import { Operator } from 'rxjs/Operator';
import { Subscriber } from 'rxjs/Subscriber';
import { Subscription } from 'rxjs/Subscription';
import * as firebase from 'firebase/app';
import 'firebase/database';
import * as utils from '../utils';
import {
  AFUnwrappedDataSnapshot,
  FirebaseOperationCases
} from '../interfaces';

export type FirebaseOperation = string | firebase.database.Reference | firebase.database.DataSnapshot | AFUnwrappedDataSnapshot;

export class FirebaseListObservable<T> extends Observable<T> {
  constructor(public $ref: firebase.database.Reference | firebase.database.Query, subscribe?: <R>(subscriber: Subscriber<R>) => Subscription | Function | void) {
    super(subscribe);
  }
  lift<T, R>(operator: Operator<T, R>): Observable<R> {
    const observable = new FirebaseListObservable<R>(this.$ref);
    observable.source = this;
    observable.operator = operator;
    observable.$ref = this.$ref;
    return observable;
  }

  push(value: any, onComplete?: (a: Object) => any): firebase.database.ThenableReference {
    if (!this.$ref) {
      throw new Error('No ref specified for this Observable!');
    }
    return this.$ref.ref.push(value, onComplete);
  }

  transaction(item: FirebaseOperation, transactionUpdate: (a: any) => any, onComplete?: (a: Object, b: boolean, c: firebase.database.DataSnapshot) => any, applyLocally?: boolean): firebase.Promise<any> {
    return this._checkOperationCases(item, {
      stringCase: () => this.$ref.ref.child(<string>item).transaction(transactionUpdate, onComplete, applyLocally),
      firebaseCase: () => (<firebase.database.Reference>item).transaction(transactionUpdate, onComplete, applyLocally),
      snapshotCase: () => (<firebase.database.DataSnapshot>item).ref.transaction(transactionUpdate, onComplete, applyLocally),
      unwrappedSnapshotCase: () => this.$ref.ref.child((<AFUnwrappedDataSnapshot>item).$key).transaction(transactionUpdate, onComplete, applyLocally)
    });
  }

  update(item: FirebaseOperation, value: Object, onComplete?: (a: Object) => any): firebase.Promise<void> {
    return this._checkOperationCases(item, {
      stringCase: () => this.$ref.ref.child(<string>item).update(value, onComplete),
      firebaseCase: () => (<firebase.database.Reference>item).update(value, onComplete),
      snapshotCase: () => (<firebase.database.DataSnapshot>item).ref.update(value, onComplete),
      unwrappedSnapshotCase: () => this.$ref.ref.child((<AFUnwrappedDataSnapshot>item).$key).update(value, onComplete)
    });
  }

  remove(onComplete?: (a: Object) => any): firebase.Promise<void>
  remove(item?: FirebaseOperation, onComplete?: (a: Object) => any): firebase.Promise<void>
  remove(item?: any, onComplete?: (a: Object) => any): firebase.Promise<void> {
    if (typeof item === 'function') {
      onComplete = item;
      item = undefined;
    }
    
    // if no item parameter is provided, remove the whole list
    if (!item) {
      return this.$ref.ref.remove(onComplete);
    }
    return this._checkOperationCases(item, {
      stringCase: () => this.$ref.ref.child(<string>item).remove(onComplete),
      firebaseCase: () => (<firebase.database.Reference>item).remove(onComplete),
      snapshotCase: () => (<firebase.database.DataSnapshot>item).ref.remove(onComplete),
      unwrappedSnapshotCase: () => this.$ref.ref.child((<AFUnwrappedDataSnapshot>item).$key).remove(onComplete)
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
    throw new Error(`Method requires a key, snapshot, reference, or unwrapped snapshot. Got: ${typeof item}`);
  }

}
