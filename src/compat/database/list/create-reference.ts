import { AngularFireList, ChildEvent, DatabaseQuery } from '../interfaces';
import { snapshotChanges } from './snapshot-changes';
import { stateChanges } from './state-changes';
import { auditTrail } from './audit-trail';
import { createDataOperationMethod } from './data-operation';
import { createRemoveMethod } from './remove';
import { AngularFireDatabase } from '../database';
import { map } from 'rxjs/operators';

export function createListReference<T= any>(query: DatabaseQuery, afDatabase: AngularFireDatabase): AngularFireList<T> {
  const outsideAngularScheduler = afDatabase.schedulers.outsideAngular;
  const refInZone = afDatabase.schedulers.ngZone.run(() => query.ref);
  return {
    query,
    update: createDataOperationMethod<Partial<T>>(refInZone, 'update'),
    set: createDataOperationMethod<T>(refInZone, 'set'),
    push: (data: T) => refInZone.push(data),
    remove: createRemoveMethod(refInZone),
    snapshotChanges(events?: ChildEvent[]) {
      return snapshotChanges<T>(query, events, outsideAngularScheduler).pipe(afDatabase.keepUnstableUntilFirst);
    },
    stateChanges(events?: ChildEvent[]) {
      return stateChanges<T>(query, events, outsideAngularScheduler).pipe(afDatabase.keepUnstableUntilFirst);
    },
    auditTrail(events?: ChildEvent[]) {
      return auditTrail<T>(query, events, outsideAngularScheduler).pipe(afDatabase.keepUnstableUntilFirst);
    },
    valueChanges<K extends string>(events?: ChildEvent[], options?: {idField?: K}) {
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
            return a.payload.val() as T;
          }
        })),
        afDatabase.keepUnstableUntilFirst
      );
    }
  };
}
