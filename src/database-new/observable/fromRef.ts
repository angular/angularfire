import { DatabaseQuery, DatabaseSnapshot, ListenEvent, SnapshotChange } from '../interfaces';
import { Observable } from 'rxjs/Observable';

/**
 * Create an observable from a Database Reference or Database Query.
 * @param ref Database Reference
 * @param event Listen event type ('value', 'added', 'changed', 'removed', 'moved')
 */
export function fromRef(ref: DatabaseQuery, event: ListenEvent): Observable<SnapshotChange> {
  return new Observable<DatabaseSnapshot | null>(subscriber => {
    ref.on(event, subscriber.next, subscriber.error);
    return { 
      unsubscribe() { 
        ref.off(event); 
      } 
    };
  }).map(snapshot => ({ event, snapshot }));
}
