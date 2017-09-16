import { Observable } from 'rxjs/Observable';
import { fromRef } from '../observable/fromRef';
import { DatabaseQuery, DatabaseSnapshot } from '../interfaces';
import { database } from 'firebase/app';

export function createObjectSnapshotChanges(query: DatabaseQuery) {
  return function snapshotChanges<T>(): Observable<DatabaseSnapshot | null> {
    return fromRef(query, 'value')
      .map(change => change.payload.snapshot ? change.payload.snapshot : null);
  }
}
