import { pendingUntilEvent } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AngularFireDatabase } from '../database';
import { AngularFireObject, DatabaseQuery } from '../interfaces';
import { createObjectSnapshotChanges } from './snapshot-changes';

export function createObjectReference<T= any>(query: DatabaseQuery, afDatabase: AngularFireDatabase): AngularFireObject<T> {
  return {
    query,
    snapshotChanges<T>() {
      return createObjectSnapshotChanges<T>(query, afDatabase.schedulers.outsideAngular)().pipe(
        pendingUntilEvent()
      );
    },
    update(data: Partial<T>) { return query.ref.update(data as any) as Promise<void>; },
    set(data: T) { return query.ref.set(data) as Promise<void>; },
    remove() { return query.ref.remove() as Promise<void>; },
    valueChanges<T>() {
      const snapshotChanges$ = createObjectSnapshotChanges(query, afDatabase.schedulers.outsideAngular)();
      return snapshotChanges$.pipe(
        pendingUntilEvent(),
        map(action => action.payload.exists() ? action.payload.val() as T : null)
      );
    },
  };
}
