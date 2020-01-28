import { DatabaseQuery, ChildEvent, AngularFireAction, SnapshotAction } from '../interfaces';
import { fromRef } from '../observable/fromRef';
import { validateEventsArray } from './utils';
import { SchedulerLike, Observable, merge } from 'rxjs';
import { DatabaseSnapshot } from '../interfaces';

export function stateChanges<T>(query: DatabaseQuery, events?: ChildEvent[], scheduler?: SchedulerLike) {
  events = validateEventsArray(events)!;
  const childEvent$ = events.map(event => fromRef<T>(query, event, 'on', scheduler));
  return merge(...childEvent$);
}
