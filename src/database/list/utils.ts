import { isNil } from '../utils';

export function validateEventsArray(events?: any[]) {
  if(isNil(events) || events!.length === 0) {
    events = ['child_added', 'child_removed', 'child_changed', 'child_moved'];
  }
  return events;
}

export function positionFor(changes, key) {
  const len = changes.length;
  for(let i=0; i<len; i++) {
    if(changes[i].snapshot.key === key) {
      return i;
    }
  }
  return -1;
}

export function positionAfter(changes, prevKey: string) {
  if(prevKey === null) { 
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
