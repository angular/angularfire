import { DatabaseQuery, ChildEvent, SnapshotChange, SnapshotPrevKey } from '../interfaces';
import { fromRef } from '../observable/fromRef';
import { validateEventsArray } from './utils';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/scan';

export function createStateChanges(query: DatabaseQuery) {
  return (events?: ChildEvent[]) => stateChanges(query, events);
}

export function stateChanges(query: DatabaseQuery, events?: ChildEvent[]) {
  events = validateEventsArray(events)!;
  const childEvent$ = events.map(event => fromRef(query, event));
  return Observable
    .merge(...childEvent$)
    .scan((current, change) => [...current, change], []);
}
