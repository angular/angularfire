import { DatabaseQuery, AngularFireList, ChildEvent } from '../interfaces';
import { snapshotChanges } from './snapshot-changes';
import { stateChanges } from './state-changes';
import { auditTrail } from './audit-trail';
import { createDataOperationMethod } from './data-operation';
import { createRemoveMethod } from './remove';
import { AngularFireDatabase } from '../database';
import { map } from 'rxjs/operators';

export function createListReference<T=any>(query: DatabaseQuery, afDatabase: AngularFireDatabase): AngularFireList<T> {
  const outsideAngularScheduler = afDatabase.schedulers.outsideAngular;
  return {
    query,
    update: createDataOperationMethod<Partial<T>>(query.ref, 'update'),
    set: createDataOperationMethod<T>(query.ref, 'set'),
    push: (data: T) => query.ref.push(data),
    remove: createRemoveMethod(query.ref),
    snapshotChanges(events?: ChildEvent[]) {
      return snapshotChanges<T>(query, events, outsideAngularScheduler).pipe(afDatabase.keepUnstableUntilFirst);
    },
    stateChanges(events?: ChildEvent[]) {
      return stateChanges<T>(query, events, outsideAngularScheduler).pipe(afDatabase.keepUnstableUntilFirst);
    },
    auditTrail(events?: ChildEvent[]) {
      return auditTrail<T>(query, events, outsideAngularScheduler).pipe(afDatabase.keepUnstableUntilFirst);
    },
    valueChanges(events?: ChildEvent[]) {
      const snapshotChanges$ = snapshotChanges<T>(query, events, outsideAngularScheduler);
      return snapshotChanges$.pipe(
        afDatabase.keepUnstableUntilFirst,
        map(actions => actions.map(a => a.payload.val() as T))
      );
    }
  }
}
