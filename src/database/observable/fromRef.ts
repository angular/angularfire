import { DatabaseQuery, DatabaseSnapshot, ListenEvent, SnapshotPrevKey, AngularFireAction } from '../interfaces';
import { Observable } from 'rxjs/Observable';
import { observeOn } from 'rxjs/operator/observeOn';
import { ZoneScheduler } from 'angularfire2';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/share';

/**
 * Create an observable from a Database Reference or Database Query.
 * @param ref Database Reference
 * @param event Listen event type ('value', 'added', 'changed', 'removed', 'moved')
 */
export function fromRef(ref: DatabaseQuery, event: ListenEvent, listenType = 'on'): Observable<AngularFireAction<DatabaseSnapshot | null>> {
  const ref$ = new Observable<SnapshotPrevKey | null | undefined>(subscriber => {
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
    if(snapshot) { key = snapshot.key; }
    return { type: event, payload: snapshot, prevKey, key, loaded: true };
  })
  // Ensures subscribe on observable is async. This handles
  // a quirk in the SDK where on/once callbacks can happen
  // synchronously.
  .delay(0); 
  return observeOn.call(ref$, new ZoneScheduler(Zone.current));
}
