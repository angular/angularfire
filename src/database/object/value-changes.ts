import { Observable } from 'rxjs/Observable';
import { fromRef } from '../observable/fromRef';
import { DatabaseQuery, ChildEvent } from '../interfaces';

export function createObjectValueChanges<T>(query: DatabaseQuery) {
  return function valueChanges<T>(): Observable<T | null> {
    return fromRef(query, 'value')
      .map(change => change.payload ? change.payload.val() : null);
  }
}
