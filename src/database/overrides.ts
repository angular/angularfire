import { LogLevel, ɵzoneWrap } from '@angular/fire';
import { ListenEvent, fromRef as _fromRef } from 'rxfire/database';

const fromRefUntilFirst = ɵzoneWrap(_fromRef, true, LogLevel.WARN);
const fromRefWithoutWaiting = ɵzoneWrap(_fromRef, false, LogLevel.WARN);

// Only the value event fires on attach whatever the node holds. A child event may never fire.
export const fromRef: typeof _fromRef = (ref, event) =>
  event === ListenEvent.value ? fromRefUntilFirst(ref, event) : fromRefWithoutWaiting(ref, event);
