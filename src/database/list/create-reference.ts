import { DatabaseQuery, ListReference } from '../interfaces';
import { createListValueChanges } from './value-changes';
import { createListSnapshotChanges } from './snapshot-changes';
import { createDataOperationMethod } from './data-operation';
import { createRemoveMethod } from './remove';

export function createListReference<T>(query: DatabaseQuery): ListReference<T> {
  return {
    query,
    snapshotChanges: createListSnapshotChanges(query),
    valueChanges<T>() { return createListSnapshotChanges(query)().map(snaps => snaps.map(snap => snap!.val())); },
    update: createDataOperationMethod<T>(query.ref, 'update'),
    set: createDataOperationMethod<T>(query.ref, 'set'),
    push: (data: T) => query.ref.push(data),
    remove: createRemoveMethod(query.ref)
  }
}
