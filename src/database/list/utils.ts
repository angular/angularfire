import { isNil } from '../utils';
import { SnapshotAction } from '../interfaces';

export function validateEventsArray(events?: any[]) {
  if(isNil(events) || events!.length === 0) {
    events = ['child_added', 'child_removed', 'child_changed', 'child_moved'];
  }
  return events;
}