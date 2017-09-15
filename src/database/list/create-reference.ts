import { DatabaseQuery, ListReference } from '../interfaces';
import { createListValueChanges } from './value-changes';
import { createLoadedChanges } from './loaded';
import { createDataOperationMethod } from './data-operation';
import { createRemoveMethod } from './remove';

export function createListReference<T>(query: DatabaseQuery): ListReference<T> {
  return {
    query,
    snapshotChanges: createLoadedChanges(query),
    valueChanges<T>() { return createLoadedChanges(query)().map(snaps => snaps.map(snap => snap!.val())); },
    update: createDataOperationMethod<T>(query.ref, 'update'),
    set: createDataOperationMethod<T>(query.ref, 'set'),
    push: (data: T) => query.ref.push(data),
    remove: createRemoveMethod(query.ref)
  }
}
