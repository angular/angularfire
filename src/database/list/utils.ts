import { isNil } from '../utils';
import { SnapshotAction } from '../interfaces';

export function validateEventsArray(events?: any[]) {
  if(isNil(events) || events!.length === 0) {
    events = ['child_added', 'child_removed', 'child_changed', 'child_moved'];
  }
  return events;
}

export function positionFor(changes: SnapshotAction[], key) {
  const len = changes.length;
  for(let i=0; i<len; i++) {
    if(changes[i].payload!.key === key) {
      return i;
    }
  }
  return -1;
}

export function positionAfter(changes: SnapshotAction[], prevKey?: string) {
  if(isNil(prevKey)) { 
    return 0; 
  } else {
    const i = positionFor(changes, prevKey);
    if( i === -1) {
      return changes.length;
    } else {
      return i + 1;
    }
  }
}
