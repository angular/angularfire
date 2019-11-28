import { DatabaseQuery, ChildEvent} from '../interfaces';
import { fromRef } from '../observable/fromRef';
import { validateEventsArray } from './utils';
import { merge } from 'rxjs';

export function stateChanges<T>(query: DatabaseQuery, events?: ChildEvent[]) {
  events = validateEventsArray(events)!;
  const childEvent$ = events.map(event => fromRef<T>(query, event));
  return merge(...childEvent$);
}
