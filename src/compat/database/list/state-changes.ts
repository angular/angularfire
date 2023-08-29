import { SchedulerLike, merge } from 'rxjs';
import { ChildEvent, DatabaseQuery } from '../interfaces';
import { fromRef } from '../observable/fromRef';
import { validateEventsArray } from './utils';

export function stateChanges<T>(query: DatabaseQuery, events?: ChildEvent[], scheduler?: SchedulerLike) {
  events = validateEventsArray(events);
  const childEvent$ = events.map(event => fromRef<T>(query, event, 'on', scheduler));
  return merge(...childEvent$);
}
