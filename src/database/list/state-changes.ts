import { ChildEvent, DatabaseQuery } from '../interfaces';
import { fromRef } from '../observable/fromRef';
import { validateEventsArray } from './utils';
import { merge, SchedulerLike } from 'rxjs';

export function stateChanges<T>(query: DatabaseQuery, events?: ChildEvent[], scheduler?: SchedulerLike) {
  events = validateEventsArray(events)!;
  const childEvent$ = events.map(event => fromRef<T>(query, event, 'on', scheduler));
  return merge(...childEvent$);
}
