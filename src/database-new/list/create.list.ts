import { DatabaseQuery, AngularFireList } from '../interfaces';
import { createValueChanges } from '../observable/value-changes';

export function createList<T>(query: DatabaseQuery): AngularFireList<T> {
  return {
    query,
    valueChanges: createValueChanges(query)
  }
}
