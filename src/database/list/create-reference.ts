import { DatabaseQuery, AngularFireList, ChildEvent } from '../interfaces';
import { snapshotChanges } from './snapshot-changes';
import { createStateChanges } from './state-changes';
import { createAuditTrail } from './audit-trail';
import { createDataOperationMethod } from './data-operation';
import { createRemoveMethod } from './remove';
import { AngularFireDatabase } from '../database';

export function createListReference<T>(query: DatabaseQuery, afDatabase: AngularFireDatabase): AngularFireList<T> {
  return {
    query,
    update: createDataOperationMethod<Partial<T>>(query.ref, 'update'),
    set: createDataOperationMethod<T>(query.ref, 'set'),
    push: (data: T) => query.ref.push(data),
    remove: createRemoveMethod(query.ref),
    snapshotChanges(events?: ChildEvent[]) {
      const snapshotChanges$ = snapshotChanges(query, events);
      return afDatabase.scheduler.keepUnstableUntilFirst(snapshotChanges$);
    },
    stateChanges: createStateChanges(query),
    auditTrail: createAuditTrail(query),
    valueChanges<T>(events?: ChildEvent[]) { 
      const snapshotChanges$ = snapshotChanges(query, events);
      return afDatabase.scheduler.keepUnstableUntilFirst(snapshotChanges$)
        .map(actions => actions.map(a => a.payload.val())); 
    }
  }
}
