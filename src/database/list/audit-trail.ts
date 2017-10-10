import { DatabaseQuery, ChildEvent, AngularFireAction, SnapshotAction } from '../interfaces';
import { stateChanges } from './state-changes';
import { loadedSnapshotChanges } from './loaded';
import { Observable } from 'rxjs/Observable';
import { database } from 'firebase/app';
import 'rxjs/add/operator/skipWhile';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/map';

export function createAuditTrail(query: DatabaseQuery) {
  return (events?: ChildEvent[]) => auditTrail(query, events);
}

export function auditTrail(query: DatabaseQuery, events?: ChildEvent[]): Observable<SnapshotAction[]> {
  return loadedSnapshotChanges(query, events);
}
