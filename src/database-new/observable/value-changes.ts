import { Observable } from 'rxjs/Observable';
import { changes } from './changes';
import { DatabaseQuery, ChildEvent } from '../interfaces';

export function createValueChanges<T>(query: DatabaseQuery) {
  return function valueChanges<T>(events: ChildEvent[]): Observable<T[]> {
    return changes<T>(query, events)
      .map(changes => changes.map(change => change.snapshot!.val()))
  }
}

