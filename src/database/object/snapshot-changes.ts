import { Observable } from 'rxjs/Observable';
import { fromRef } from '../observable/fromRef';
import { DatabaseQuery, AngularFireAction, SnapshotAction } from '../interfaces';
import { DataSnapshot } from '@firebase/database-types';

export function createObjectSnapshotChanges(query: DatabaseQuery) {
  return function snapshotChanges(): Observable<SnapshotAction> {
    return fromRef(query, 'value');
  }
}
