import { Observable, SchedulerLike } from 'rxjs';
import { DatabaseQuery, SnapshotAction } from '../interfaces';
import { fromRef } from '../observable/fromRef';

export function createObjectSnapshotChanges<T>(query: DatabaseQuery, scheduler?: SchedulerLike) {
  return function snapshotChanges(): Observable<SnapshotAction<T>> {
    return fromRef(query, 'value', 'on', scheduler);
  };
}
