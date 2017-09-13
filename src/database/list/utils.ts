import { isNil } from '../utils';

export function validateEventsArray(events?: any[]) {
  if(isNil(events) || events!.length === 0) {
    events = ['added', 'removed', 'changed', 'moved'];
  }
  return events;
}
