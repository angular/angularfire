import { DatabaseQuery, ChildEvent, AngularFireAction, SnapshotAction } from '../interfaces';
import { fromRef } from '../observable/fromRef';
import { validateEventsArray } from './utils';
import { Observable } from 'rxjs';
import { merge } from 'rxjs/observable/merge';

import { DatabaseSnapshot } from '../interfaces';
import { AngularFireDatabase } from '../database';

export function stateChanges<T>(query: DatabaseQuery, events?: ChildEvent[]) {
  events = validateEventsArray(events)!;
  const childEvent$ = events.map(event => fromRef<T>(query, event));
  return merge(...childEvent$);
}
