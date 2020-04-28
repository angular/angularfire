import { asyncScheduler, Observable, SchedulerLike } from 'rxjs';
import { Action, DocumentReference, DocumentSnapshot, Query, QuerySnapshot, Reference } from '../interfaces';
import { map } from 'rxjs/operators';

function _fromRef<T, R>(ref: Reference<T>, scheduler: SchedulerLike = asyncScheduler): Observable<R> {
  return new Observable(subscriber => {
    let unsubscribe;
    if (scheduler != null) {
      scheduler.schedule(() => {
        unsubscribe = ref.onSnapshot(subscriber);
      });
    } else {
      unsubscribe = ref.onSnapshot(subscriber);
    }

    return function() {
      if (unsubscribe != null) {
        unsubscribe();
      }
    };
  });
}

export function fromRef<R>(ref: DocumentReference | Query, scheduler?: SchedulerLike) {
  return _fromRef<typeof ref, R>(ref, scheduler);
}

export function fromDocRef<T>(ref: DocumentReference, scheduler?: SchedulerLike): Observable<Action<DocumentSnapshot<T>>> {
  return fromRef<DocumentSnapshot<T>>(ref, scheduler)
    .pipe(
      map(payload => ({ payload, type: 'value' }))
    );
}

export function fromCollectionRef<T>(ref: Query, scheduler?: SchedulerLike): Observable<Action<QuerySnapshot<T>>> {
  return fromRef<QuerySnapshot<T>>(ref, scheduler).pipe(map(payload => ({ payload, type: 'query' })));
}
