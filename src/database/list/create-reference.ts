import { DatabaseQuery, ListReference, ChildEvent } from '../interfaces';
import { createLoadedChanges, loadedSnapshotChanges } from './loaded';
import { createDataOperationMethod } from './data-operation';
import { createRemoveMethod } from './remove';

export function createListReference<T>(query: DatabaseQuery): ListReference<T> {
  return {
    query,
    update: createDataOperationMethod<T>(query.ref, 'update'),
    set: createDataOperationMethod<T>(query.ref, 'set'),
    push: (data: T) => query.ref.push(data),
    remove: createRemoveMethod(query.ref),
    snapshotChanges: createLoadedChanges(query),
    valueChanges<T>(events?: ChildEvent[]) { 
      return loadedSnapshotChanges(query, events)
        .map(snaps => snaps.map(snap => snap!.val())); 
    }
  }
}
