import { Observable, SchedulerLike } from 'rxjs';
import { ChildEvent, DatabaseQuery, SnapshotAction } from '../interfaces';
import { listChanges } from './changes';
import { validateEventsArray } from './utils';

export function snapshotChanges<T>(
  query: DatabaseQuery,
  events?: ChildEvent[],
  scheduler?: SchedulerLike
): Observable<SnapshotAction<T>[]> {
  events = validateEventsArray(events);
  return listChanges<T>(query, events, scheduler);
}
