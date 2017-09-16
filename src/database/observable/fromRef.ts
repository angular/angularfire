import { DatabaseQuery, DatabaseSnapshot, ListenEvent, SnapshotChange, Action, SnapshotPrevKey } from '../interfaces';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/delay';

/**
 * Create an observable from a Database Reference or Database Query.
 * @param ref Database Reference
 * @param event Listen event type ('value', 'added', 'changed', 'removed', 'moved')
 */
export function fromRef(ref: DatabaseQuery, event: ListenEvent, listenType = 'on'): Observable<Action<SnapshotPrevKey>> {
  return new Observable<SnapshotPrevKey | null | undefined>(subscriber => {
    const fn = ref[listenType](event, (snapshot, prevKey) => {
      subscriber.next({ snapshot, prevKey })
    }, subscriber.error.bind(subscriber));
    return { unsubscribe() { ref.off(event, fn)} }
  })
  .map((payload: SnapshotPrevKey) =>  { 
    return { type: event, payload };
  }).delay(0);
}
