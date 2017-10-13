import { DatabaseQuery, ChildEvent, AngularFireAction, SnapshotAction } from '../interfaces';
import { stateChanges } from './state-changes';
import { waitForLoaded } from './loaded';
import { Observable } from 'rxjs/Observable';
import { database } from 'firebase/app';

export function createAuditTrail(query: DatabaseQuery) {
  return (events?: ChildEvent[]) => auditTrail(query, events);
}

export function auditTrail(query: DatabaseQuery, events?: ChildEvent[]): Observable<SnapshotAction[]> {
  const auditTrail$ = stateChanges(query, events)
    .scan((current, action) => [...current, action], []);
  return waitForLoaded(query, auditTrail$);
}
