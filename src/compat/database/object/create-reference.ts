import { map } from 'rxjs/operators';
import { AngularFireObject, DatabaseQuery } from '../interfaces';
import { createObjectSnapshotChanges } from './snapshot-changes';
import { AngularFireDatabase } from '../database';
import { keepUnstableUntilFirst } from '@angular/fire';

export function createObjectReference<T= any>(query: DatabaseQuery, afDatabase: AngularFireDatabase): AngularFireObject<T> {
  return {
    query,
    snapshotChanges<T>() {
      return createObjectSnapshotChanges<T>(query, afDatabase.schedulers.outsideAngular)().pipe(
        keepUnstableUntilFirst
      );
    },
    update(data: Partial<T>) { return query.ref.update(data as any) as Promise<void>; },
    set(data: T) { return query.ref.set(data) as Promise<void>; },
    remove() { return query.ref.remove() as Promise<void>; },
    valueChanges<T>() {
      const snapshotChanges$ = createObjectSnapshotChanges(query, afDatabase.schedulers.outsideAngular)();
      return snapshotChanges$.pipe(
        keepUnstableUntilFirst,
        map(action => action.payload.exists() ? action.payload.val() as T : null)
      );
    },
  };
}
