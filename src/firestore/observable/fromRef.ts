import { Observable, Subscriber } from 'rxjs';
import { DocumentReference, Query, Action, Reference, DocumentSnapshot, QuerySnapshot } from '../interfaces';
import { map, share } from 'rxjs/operators';
import { firestore } from 'firebase';

function _fromRef<T, R>(ref: any, options?: firestore.SnapshotListenOptions): Observable<R> {
  return new Observable(subscriber => {
    const unsubscribe = ref.onSnapshot(options || {}, ref as any)
    return { unsubscribe };
  });
}

export function fromRef<R>(ref: any, options?: firestore.SnapshotListenOptions) {
  return _fromRef<typeof ref, R>(ref, options).pipe(share());
}

export function fromDocRef<T>(ref: any, options?: firestore.SnapshotListenOptions): Observable<Action<DocumentSnapshot<T>>>{
  return fromRef<DocumentSnapshot<T>>(options, ref)
    .pipe(
      map(payload => ({ payload, type: 'value' }))
    );
}

export function fromCollectionRef<T>(ref: Query, options?: firestore.SnapshotListenOptions,): Observable<Action<QuerySnapshot<T>>> {
  return fromRef<QuerySnapshot<T>>(ref, options).pipe(map(payload => ({ payload, type: 'query' })));
}
