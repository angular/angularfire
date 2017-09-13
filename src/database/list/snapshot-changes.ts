import { Observable } from 'rxjs/Observable';
import { listChanges } from './changes';
import { DatabaseQuery, ChildEvent, DatabaseSnapshot } from '../interfaces';
import { database } from 'firebase/app';
import { validateEventsArray } from './utils';
import 'rxjs/add/operator/map';

// TODO(davideast): Test safety of ! unwrap
export function createListSnapshotChanges(query: DatabaseQuery) {
  return function snapshotChanges(events?: ChildEvent[]): Observable<DatabaseSnapshot[]> {
    events = validateEventsArray(events);
    return listChanges(query, events!)
      .map(changes => changes.map(change => change.snapshot!));
  }
}
