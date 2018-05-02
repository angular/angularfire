import { DatabaseQuery, DatabaseSnapshot, ListenEvent, AngularFireAction } from '../interfaces';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/share';

interface SnapshotPrevKey {
  snapshot: DatabaseSnapshot;
  prevKey: string | null | undefined;
}

/**
 * Create an observable from a Database Reference or Database Query.
 * @param ref Database Reference
 * @param event Listen event type ('value', 'added', 'changed', 'removed', 'moved')
 */
export function fromRef(ref: DatabaseQuery, event: ListenEvent, listenType = 'on'): Observable<AngularFireAction<DatabaseSnapshot>> {
  return new Observable<SnapshotPrevKey>(subscriber => {
    const fn = ref[listenType](event, (snapshot, prevKey) => {
      subscriber.next({ snapshot, prevKey });
      if (listenType == 'once') { subscriber.complete(); }
    }, subscriber.error.bind(subscriber));
    if (listenType == 'on') {
      return { unsubscribe() { ref.off(event, fn)} };
    } else {
      return { unsubscribe() { } };
    }
  })
  .map((payload: SnapshotPrevKey) =>  {
    const { snapshot, prevKey } = payload;
    let key: string | null = null;
    if (snapshot.exists()) { key = snapshot.key; }
    return { type: event, payload: snapshot, prevKey, key };
  })
  // Ensures subscribe on observable is async. This handles
  // a quirk in the SDK where on/once callbacks can happen
  // synchronously.
  .debounceTime(0)
  .share();
}
