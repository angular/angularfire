import { DatabaseQuery, DatabaseSnapshot, ListenEvent, AngularFireAction } from '../interfaces';
import { Observable } from 'rxjs';
import { FirebaseZoneScheduler } from 'angularfire2';
import { map, delay, share } from 'rxjs/operators';

interface SnapshotPrevKey<T> {
  snapshot: DatabaseSnapshot<T>;
  prevKey: string | null | undefined;
}

/**
 * Create an observable from a Database Reference or Database Query.
 * @param ref Database Reference
 * @param event Listen event type ('value', 'added', 'changed', 'removed', 'moved')
 */
export function fromRef<T>(ref: DatabaseQuery, event: ListenEvent, listenType = 'on'): Observable<AngularFireAction<DatabaseSnapshot<T>>> {
  return new Observable<SnapshotPrevKey<T>>(subscriber => {
    const fn = ref[listenType](event, (snapshot, prevKey) => {
      subscriber.next({ snapshot, prevKey });
      if (listenType == 'once') { subscriber.complete(); }
    }, subscriber.error.bind(subscriber));
    if (listenType == 'on') {
      return { unsubscribe() { ref.off(event, fn)} };
    } else {
      return { unsubscribe() { } };
    }
  }).pipe(
    map(payload =>  {
      const { snapshot, prevKey } = payload;
      let key: string | null = null;
      if (snapshot.exists()) { key = snapshot.key; }
      return { type: event, payload: snapshot, prevKey, key };
    }),
    // Ensures subscribe on observable is async. This handles
    // a quirk in the SDK where on/once callbacks can happen
    // synchronously.
    delay(0),
    share()
  );
}
