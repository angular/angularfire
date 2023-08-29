import { keepUnstableUntilFirst } from '@angular/fire';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AngularFireDatabase } from '../database';
import { AngularFireList, ChildEvent, DatabaseQuery } from '../interfaces';
import { auditTrail } from './audit-trail';
import { createDataOperationMethod } from './data-operation';
import { createRemoveMethod } from './remove';
import { snapshotChanges } from './snapshot-changes';
import { stateChanges } from './state-changes';

export function createListReference<T= any>(query: DatabaseQuery, afDatabase: AngularFireDatabase): AngularFireList<T> {
  const outsideAngularScheduler = afDatabase.schedulers.outsideAngular;
  const refInZone = afDatabase.schedulers.ngZone.run(() => query.ref);
  return {
    query,
    update: createDataOperationMethod(refInZone, 'update'),
    set: createDataOperationMethod(refInZone, 'set'),
    push: (data: T) => refInZone.push(data),
    remove: createRemoveMethod(refInZone),
    snapshotChanges(events?: ChildEvent[]) {
      return snapshotChanges<T>(query, events, outsideAngularScheduler).pipe(keepUnstableUntilFirst);
    },
    stateChanges(events?: ChildEvent[]) {
      return stateChanges<T>(query, events, outsideAngularScheduler).pipe(keepUnstableUntilFirst);
    },
    auditTrail(events?: ChildEvent[]) {
      return auditTrail<T>(query, events, outsideAngularScheduler).pipe(keepUnstableUntilFirst);
    },
    valueChanges<K extends string>(events?: ChildEvent[], options?: {idField?: K}): Observable<(T & Record<string, string>)[]> {
      const snapshotChanges$ = snapshotChanges<T>(query, events, outsideAngularScheduler);
      return snapshotChanges$.pipe(
        map(actions => actions.map(a => {
          if (options && options.idField) {
            return {
              ...a.payload.val() as T,
              ...{
                [options.idField]: a.key
              }
            };
          } else {
            return a.payload.val() as T & Record<string, string>
          }
        })),
        keepUnstableUntilFirst
      );
    }
  };
}
