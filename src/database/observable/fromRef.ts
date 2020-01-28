import { DatabaseQuery, DatabaseSnapshot, ListenEvent, AngularFireAction } from '../interfaces';
import { Observable, SchedulerLike, queueScheduler, asyncScheduler } from 'rxjs';
import { map, share } from 'rxjs/operators';

interface SnapshotPrevKey<T> {
  snapshot: DatabaseSnapshot<T>;
  prevKey: string | null | undefined;
}

/**
 * Create an observable from a Database Reference or Database Query.
 * @param ref Database Reference
 * @param event Listen event type ('value', 'added', 'changed', 'removed', 'moved')
 */
export function fromRef<T>(ref: DatabaseQuery, event: ListenEvent, listenType = 'on', scheduler: SchedulerLike = asyncScheduler): Observable<AngularFireAction<DatabaseSnapshot<T>>> {
  return new Observable<SnapshotPrevKey<T>>(subscriber => {
    let fn: any | null = null;
    fn = ref[listenType](event, (snapshot, prevKey) => {
      scheduler.schedule(() => {
        subscriber.next({ snapshot, prevKey });
      });
      if (listenType == 'once') {
        scheduler.schedule(() => subscriber.complete());
      }
    }, err => {
      scheduler.schedule(() => subscriber.error(err))
    });

    if (listenType == 'on') {
      return {
        unsubscribe() {
          if (fn != null) {
            ref.off(event, fn);
          }
        }
      };
    } else {
      return { unsubscribe() { } };
    }
  }).pipe(
    map(payload => {
      const { snapshot, prevKey } = payload;
      let key: string | null = null;
      if (snapshot.exists()) { key = snapshot.key; }
      return { type: event, payload: snapshot, prevKey, key };
    }),
    share()
  );
}
