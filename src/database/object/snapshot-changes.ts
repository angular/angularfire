import { Observable, SchedulerLike } from 'rxjs';
import { fromRef } from '../observable/fromRef';
import { DatabaseQuery, SnapshotAction } from '../interfaces';

export function createObjectSnapshotChanges<T>(query: DatabaseQuery, scheduler?: SchedulerLike) {
  return function snapshotChanges(): Observable<SnapshotAction<T>> {
    return fromRef(query, 'value', 'on', scheduler);
  }
}
