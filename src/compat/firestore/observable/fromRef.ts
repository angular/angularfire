import { asyncScheduler, Observable, SchedulerLike } from 'rxjs';
import { Action, DocumentReference, DocumentSnapshot, Query, QuerySnapshot, Reference } from '../interfaces';
import { map, pairwise, startWith } from 'rxjs/operators';

function _fromRef<T, R>(ref: Reference<T>, scheduler: SchedulerLike = asyncScheduler): Observable<R> {
  return new Observable(subscriber => {
    let unsubscribe: () => void;
    if (scheduler != null) {
      scheduler.schedule(() => {
        unsubscribe = ref.onSnapshot({ includeMetadataChanges: true }, subscriber);
      });
    } else {
      unsubscribe = ref.onSnapshot({ includeMetadataChanges: true }, subscriber);
    }

    return () => {
      if (unsubscribe != null) {
        unsubscribe();
      }
    };
  });
}

export function fromRef<R, T>(ref: DocumentReference<T> | Query<T>, scheduler?: SchedulerLike) {
  return _fromRef<typeof ref, R>(ref, scheduler);
}

export function fromDocRef<T>(ref: DocumentReference<T>, scheduler?: SchedulerLike): Observable<Action<DocumentSnapshot<T>>> {
  return fromRef<DocumentSnapshot<T>, T>(ref, scheduler)
    .pipe(
      startWith(undefined),
      pairwise(),
      map(([priorPayload, payload]) => {
        if (!payload.exists) {
          return { payload, type: 'removed' };
        }
        if (!priorPayload?.exists) {
          return { payload, type: 'added' };
        }
        return { payload, type: 'modified' };
      })
    );
}

export function fromCollectionRef<T>(ref: Query<T>, scheduler?: SchedulerLike): Observable<Action<QuerySnapshot<T>>> {
  return fromRef<QuerySnapshot<T>, T>(ref, scheduler).pipe(map(payload => ({ payload, type: 'query' })));
}
