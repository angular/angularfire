import { Observable } from 'rxjs/Observable';
import { listChanges } from './changes';
import { DatabaseQuery, ChildEvent, SnapshotAction } from '../interfaces';
import { validateEventsArray } from './utils';
import 'rxjs/add/operator/map';

export function snapshotChanges(query: DatabaseQuery, events?: ChildEvent[]): Observable<SnapshotAction[]> {
  events = validateEventsArray(events);
  return listChanges(query, events!);
}
