import { Observable } from 'rxjs';
import { listChanges } from './changes';
import { DatabaseQuery, ChildEvent, SnapshotAction } from '../interfaces';
import { validateEventsArray } from './utils';

export function snapshotChanges(query: DatabaseQuery, events?: ChildEvent[]): Observable<SnapshotAction[]> {
  events = validateEventsArray(events);
  return listChanges(query, events!);
}
