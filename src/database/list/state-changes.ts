
import {merge as observableMerge,  Observable } from 'rxjs';
import { DatabaseQuery, ChildEvent, AngularFireAction, SnapshotAction } from '../interfaces';
import { fromRef } from '../observable/fromRef';
import { validateEventsArray } from './utils';


import { DataSnapshot } from '@firebase/database-types';
import { AngularFireDatabase } from '../database';

export function createStateChanges(query: DatabaseQuery, afDatabase: AngularFireDatabase) {
  return (events?: ChildEvent[]) => afDatabase.scheduler.keepUnstableUntilFirst(stateChanges(query, events));
}

export function stateChanges(query: DatabaseQuery, events?: ChildEvent[]) {
  events = validateEventsArray(events)!;
  const childEvent$ = events.map(event => fromRef(query, event));
  return observableMerge(...childEvent$);
}
