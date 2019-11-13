import { Observable, SchedulerLike } from 'rxjs';
import { listChanges } from './changes';
import { DatabaseQuery, ChildEvent, SnapshotAction } from '../interfaces';
import { validateEventsArray } from './utils';

export function snapshotChanges<T>(query: DatabaseQuery, events?: ChildEvent[], scheduler?: SchedulerLike): Observable<SnapshotAction<T>[]> {
  events = validateEventsArray(events);
  return listChanges<T>(query, events!, scheduler);
}
