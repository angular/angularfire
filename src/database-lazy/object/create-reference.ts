import { map, switchMap } from 'rxjs/operators';
import { AngularFireObject, DatabaseQuery } from '../interfaces';
import { createObjectSnapshotChanges } from './snapshot-changes';
import { AngularFireDatabase } from '../database';
import { Observable } from 'rxjs';

export function createObjectReference<T= any>(query$: Observable<DatabaseQuery>, afDatabase: AngularFireDatabase): AngularFireObject<T> {
  return {
    query: query$.toPromise(),
    snapshotChanges: <T>() => query$.pipe(
      switchMap(query => createObjectSnapshotChanges<T>(query, afDatabase.schedulers.outsideAngular)()),
      afDatabase.keepUnstableUntilFirst
    ),
    update: (data: Partial<T>) => query$.pipe(switchMap(query => query.ref.update(data as any))).toPromise(),
    set: (data: T) => query$.pipe(switchMap(query => query.ref.set(data))).toPromise(),
    remove: () => query$.pipe(switchMap(query => query.ref.remove())).toPromise(),
    valueChanges: <T>() => query$.pipe(
      switchMap(query =>  createObjectSnapshotChanges(query, afDatabase.schedulers.outsideAngular)()),
      afDatabase.keepUnstableUntilFirst,
      map(action => action.payload.exists() ? action.payload.val() as T : null)
    ),
  };
}
