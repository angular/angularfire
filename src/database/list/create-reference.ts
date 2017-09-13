import { DatabaseQuery, ListReference } from '../interfaces';
import { createListValueChanges } from './value-changes';
import { createListSnapshotChanges } from './snapshot-changes';

export function createListReference<T>(query: DatabaseQuery): ListReference<T> {
  return {
    query,
    valueChanges: createListValueChanges(query),
    snapshotChanges: createListSnapshotChanges(query)
  }
}
