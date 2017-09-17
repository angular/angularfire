import { Observable } from 'rxjs/Observable';
import { fromRef } from '../observable/fromRef';
import { DatabaseQuery, AngularFireAction, SnapshotAction } from '../interfaces';
import { database } from 'firebase/app';

export function createObjectSnapshotChanges(query: DatabaseQuery) {
  return function snapshotChanges<T>(): Observable<SnapshotAction> {
    return fromRef(query, 'value');
  }
}
