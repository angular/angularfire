import { DatabaseQuery, ChildEvent, DatabaseSnapshot, AngularFireAction, SnapshotAction } from '../interfaces';
import { fromRef } from '../observable/fromRef';
import { snapshotChanges } from './snapshot-changes';
import { database } from 'firebase/app';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/skipWhile';

/**
 * Creates a function that creates a "loaded observable".
 * A "loaded observable" waits until the final child emissions are
 * complete and match the last key in the dataset before emitting
 * the "whole" array. Realtime updates can continue to apply to the
 * array, but by leveraging skipWhile, we wait until the first value
 * set is "whole" so the user is inundated with child_added updates.
 * @param query 
 */
export function createLoadedChanges(query: DatabaseQuery): (events?: ChildEvent[]) => Observable<SnapshotAction[]> {
  return (events?: ChildEvent[]) => loadedSnapshotChanges(query, events);
}

export function waitForLoaded(query: DatabaseQuery, action$: Observable<SnapshotAction[]>) {
  return action$;
}

export function loadedSnapshotChanges(query: DatabaseQuery, events?: ChildEvent[]): Observable<SnapshotAction[]> {
  const snapChanges$ = snapshotChanges(query, events);
  return waitForLoaded(query, snapChanges$);
}
