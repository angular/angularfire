import { DatabaseQuery, DatabaseSnapshot, ListenEvent, SnapshotChange } from '../interfaces';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

/**
 * Create an observable from a Database Reference or Database Query.
 * @param ref Database Reference
 * @param event Listen event type ('value', 'added', 'changed', 'removed', 'moved')
 */
export function fromRef(ref: DatabaseQuery, event: ListenEvent): Observable<SnapshotChange> {
  return new Observable<DatabaseSnapshot | null>(subscriber => {
    debugger;
    const fn = ref.on(event, subscriber.next.bind(subscriber), subscriber.error.bind(subscriber));
    return { unsubscribe() { ref.off(event, fn); } }
  })  
  .map((snapshot: DatabaseSnapshot) => ({ event, snapshot }));
}
