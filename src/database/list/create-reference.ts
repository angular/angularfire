import { DatabaseQuery, AngularFireList, ChildEvent } from '../interfaces';
import { snapshotChanges } from './snapshot-changes';
import { createStateChanges } from './state-changes';
import { createAuditTrail } from './audit-trail';
import { createDataOperationMethod } from './data-operation';
import { createRemoveMethod } from './remove';

export function createListReference<T>(query: DatabaseQuery): AngularFireList<T> {
  return {
    query,
    update: createDataOperationMethod<Partial<T>>(query.ref, 'update'),
    set: createDataOperationMethod<T>(query.ref, 'set'),
    push: (data: T) => query.ref.push(data),
    remove: createRemoveMethod(query.ref),
    snapshotChanges(events?: ChildEvent[]) {
      return snapshotChanges(query, events);
    },
    stateChanges: createStateChanges(query),
    auditTrail: createAuditTrail(query),
    valueChanges<T>(events?: ChildEvent[]) { 
      return snapshotChanges(query, events)
        .map(actions => actions.map(a => a.payload.val())); 
    }
  }
}
