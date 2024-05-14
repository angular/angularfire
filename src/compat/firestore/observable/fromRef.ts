import { Observable, SchedulerLike, asyncScheduler } from 'rxjs';
import { map, pairwise, startWith } from 'rxjs/operators';
import { Action, DocumentReference, DocumentSnapshot, Query, QuerySnapshot, Reference } from '../interfaces';

function _fromRef<R>(ref: Reference, scheduler: SchedulerLike = asyncScheduler): Observable<R> {
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
  return _fromRef<R>(ref, scheduler);
}

export function fromDocRef<T>(ref: DocumentReference<T>, scheduler?: SchedulerLike): Observable<Action<DocumentSnapshot<T>>> {
  return fromRef<DocumentSnapshot<T>, T>(ref, scheduler)
    .pipe(
      startWith<DocumentSnapshot<T>, undefined>(undefined),
      pairwise(),
      map((snapshots: [DocumentSnapshot<T>, DocumentSnapshot<T>]) => {
        const [priorPayload, payload] = snapshots;
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
