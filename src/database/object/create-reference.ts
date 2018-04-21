import { DatabaseQuery, AngularFireObject } from '../interfaces';
import { createObjectSnapshotChanges } from './snapshot-changes';
import { AngularFireDatabase } from '../database';
import 'rxjs/add/operator/startWith';

export function createObjectReference<T>(query: DatabaseQuery, afDatabase: AngularFireDatabase, ssrCached?: T): AngularFireObject<T> {
  return {
    query,
    snapshotChanges<T>() {
      const snapshotChanges$ = createObjectSnapshotChanges(query)();
      return afDatabase.scheduler.keepUnstableUntilFirst(snapshotChanges$);
    },
    update(data: Partial<T>) { return query.ref.update(data as any) as Promise<void>; },
    set(data: T) { return query.ref.set(data) as Promise<void>; },
    remove() { return query.ref.remove() as Promise<void>; },
    valueChanges<T>() {
      const snapshotChanges$ = createObjectSnapshotChanges(query)();
      const baseObs = afDatabase.scheduler.keepUnstableUntilFirst(snapshotChanges$)
        .map(action => action.payload.exists() ? action.payload.val() as T : null)

      return ssrCached
        ? baseObs.startWith(ssrCached as any) // typescript issue?
        : baseObs
    },
  }
}
