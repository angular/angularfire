import { asyncScheduler, Observable, of, SchedulerLike } from 'rxjs';
import { Action, DocumentSnapshot, Reference } from '../interfaces';
import { map, pairwise, startWith, switchMap } from 'rxjs/operators';
import { DocumentReference, Query, QuerySnapshot } from 'firebase/firestore';

function _fromRef<T, R>(ref: Reference<T>, scheduler: SchedulerLike = asyncScheduler): Observable<R> {
  return of(undefined).pipe(
    switchMap(() => import(/* webpackExports: ["onSnapshot"] */ 'firebase/firestore')),
    // TODO fix the subscriber and R type
    switchMap(({ onSnapshot }) => new Observable<R>((subscriber: any) => {
      let unsubscribe: () => void;

      if (scheduler != null) {
        scheduler.schedule(() => {
          unsubscribe = onSnapshot(ref, { includeMetadataChanges: true }, subscriber);
        });
      } else {
        unsubscribe = onSnapshot(ref, { includeMetadataChanges: true }, subscriber);
      }

      return () => {
        if (unsubscribe != null) {
          unsubscribe();
        }
      };
    }))
  );
}

export function fromRef<R, T>(ref: Reference<T>, scheduler?: SchedulerLike) {
  return _fromRef<typeof ref, R>(ref, scheduler);
}

export function fromDocRef<T>(ref: DocumentReference<T>, scheduler?: SchedulerLike): Observable<Action<DocumentSnapshot<T>>> {
  // TODO fix Reference type
  return fromRef<DocumentSnapshot<T>, T>(ref as Reference<T>, scheduler)
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
  // TODO fix Reference type
  return fromRef<QuerySnapshot<T>, T>(ref as Reference<T>, scheduler).pipe(map(payload => ({ payload, type: 'query' })));
}
