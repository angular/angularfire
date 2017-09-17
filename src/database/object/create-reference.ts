import { DatabaseQuery, ObjectReference } from '../interfaces';
import { createObjectSnapshotChanges } from './snapshot-changes';

export function createObjectReference<T>(query: DatabaseQuery): ObjectReference<T> {
  return {
    query,
    snapshotChanges: createObjectSnapshotChanges(query),
    update(data: T) { return query.ref.update(data) as Promise<any>; },
    set(data: T) { return query.ref.set(data) as Promise<any>; },
    remove() { return query.ref.remove() as Promise<any>; },
    valueChanges<T>() { 
      return createObjectSnapshotChanges(query)()
        .map(action => action.payload ? action.payload.val() as T : null) 
    },
  }
}
