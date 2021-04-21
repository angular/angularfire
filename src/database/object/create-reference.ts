import { map } from 'rxjs/operators';
import { AngularFireObject, DatabaseQuery } from '../interfaces';
import { createObjectSnapshotChanges } from './snapshot-changes';
import { AngularFireDatabase } from '../database';
import { remove, set, update } from 'firebase/database';

export function createObjectReference<T= any>(query: DatabaseQuery, afDatabase: AngularFireDatabase): AngularFireObject<T> {
  return {
    query,
    snapshotChanges<T>() {
      return createObjectSnapshotChanges<T>(query, afDatabase.schedulers.outsideAngular)().pipe(
        afDatabase.keepUnstableUntilFirst
      );
    },
    update(data: Partial<T>) { return update(query.ref, data as any) as Promise<void>; },
    set(data: T) { return set(query.ref, data) as Promise<void>; },
    remove() { return remove(query.ref) as Promise<void>; },
    valueChanges<T>() {
      const snapshotChanges$ = createObjectSnapshotChanges(query, afDatabase.schedulers.outsideAngular)();
      return snapshotChanges$.pipe(
        afDatabase.keepUnstableUntilFirst,
        map(action => action.payload.exists() ? action.payload.val() as T : null)
      );
    },
  };
}
