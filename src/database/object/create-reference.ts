import { DatabaseQuery, ObjectReference } from '../interfaces';
import { createObjectValueChanges } from './value-changes';
import { createObjectSnapshotChanges } from './snapshot-changes';

export function createObjectReference<T>(query: DatabaseQuery): ObjectReference<T> {
  return {
    query,
    valueChanges: createObjectValueChanges(query),
    snapshotChanges: createObjectSnapshotChanges(query)
  }
}
