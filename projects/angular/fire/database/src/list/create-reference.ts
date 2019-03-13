import { DatabaseQuery, AngularFireList, ChildEvent } from '../interfaces';
import { snapshotChanges } from './snapshot-changes';
import { stateChanges } from './state-changes';
import { auditTrail } from './audit-trail';
import { createDataOperationMethod } from './data-operation';
import { createRemoveMethod } from './remove';
import { AngularFireDatabase } from '../database';
import { map } from 'rxjs/operators';

export function createListReference<T=any>(query: DatabaseQuery, afDatabase: AngularFireDatabase): AngularFireList<T> {
  return {
    query,
    update: createDataOperationMethod<Partial<T>>(query.ref, 'update'),
    set: createDataOperationMethod<T>(query.ref, 'set'),
    push: (data: T) => query.ref.push(data),
    remove: createRemoveMethod(query.ref),
    snapshotChanges(events?: ChildEvent[]) {
      const snapshotChanges$ = snapshotChanges<T>(query, events);
      return afDatabase.scheduler.keepUnstableUntilFirst(
        afDatabase.scheduler.runOutsideAngular(
          snapshotChanges$
        )
      );
    },
    stateChanges(events?: ChildEvent[]) {
      const stateChanges$ = stateChanges<T>(query, events);
      return afDatabase.scheduler.keepUnstableUntilFirst(
        afDatabase.scheduler.runOutsideAngular(
          stateChanges$
        )
      );
    },
    auditTrail(events?: ChildEvent[]) {
      const auditTrail$ = auditTrail<T>(query, events)
      return afDatabase.scheduler.keepUnstableUntilFirst(
        afDatabase.scheduler.runOutsideAngular(
          auditTrail$
        )
      );
    },
    valueChanges(events?: ChildEvent[]) {
      const snapshotChanges$ = snapshotChanges<T>(query, events);
      return afDatabase.scheduler.keepUnstableUntilFirst(
        afDatabase.scheduler.runOutsideAngular(
          snapshotChanges$
        )
      ).pipe(
        map(actions => actions.map(a => a.payload.val() as T))
      );
    }
  }
}
