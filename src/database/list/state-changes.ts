import { DatabaseQuery, ChildEvent, AngularFireAction, SnapshotAction } from '../interfaces';
import { fromRef } from '../observable/fromRef';
import { validateEventsArray } from './utils';
import { Observable } from 'rxjs/Observable';
import { database } from 'firebase/app';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/scan';

/**
 * NOTES FOR LATER:
 * Consider have snapshotChanges() return a SnapshotAction because it 
 * retains the event information.
 * 
 * Consider having valueChanges(), snapshotChanges(), and stateChanges()
 * return an Action. For snapshotChanges it would be an
 * Action<SnapshotPrevKey> and for valueChanges it would be an Action<T>.
 * 
 * Consider providing the delta changes for both valueChanges() and 
 * snapshotChanges().
 * 
 * Consider providing an auditTrail() method that scans over stateChanges()
 * to provide each action as an array at that occurred at that location. This
 * would be a loaded dataset.
 */

export function createStateChanges(query: DatabaseQuery) {
  return (events?: ChildEvent[]) => stateChanges(query, events);
}

export function stateChanges(query: DatabaseQuery, events?: ChildEvent[]) {
  events = validateEventsArray(events)!;
  const childEvent$ = events.map(event => fromRef(query, event));
  return Observable.merge(...childEvent$);
}
