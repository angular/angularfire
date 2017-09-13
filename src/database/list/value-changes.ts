import { Observable } from 'rxjs/Observable';
import { listChanges } from './changes';
import { DatabaseQuery, ChildEvent } from '../interfaces';
import { validateEventsArray } from './utils';
import 'rxjs/add/operator/map';

export function createListValueChanges<T>(query: DatabaseQuery) {
  return function valueChanges<T>(events?: ChildEvent[]): Observable<T[]> {
    events = validateEventsArray(events);
    return listChanges<T>(query, events!)
      .map(changes => changes.map(change => change.snapshot!.val()))
  }
}
