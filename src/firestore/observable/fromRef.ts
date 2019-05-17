import { Observable, Subscriber } from 'rxjs';
import { DocumentReference, Query, Action, Reference, DocumentSnapshot, QuerySnapshot } from '../interfaces';
import { map, share } from 'rxjs/operators';
import { firestore } from 'firebase';

function _fromRef<T, R>(ref: Reference<T>, options?: firestore.SnapshotListenOptions): Observable<R> {
  return new Observable(subscriber => {
    const unsubscribe = ref.onSnapshot(options || {}, subscriber);
    return { unsubscribe };
  });
}

export function fromRef<R>(ref: DocumentReference | Query, options?: firestore.SnapshotListenOptions) {
  return _fromRef<typeof ref, R>(ref, options).pipe(share());
}

export function fromDocRef<T>(ref: DocumentReference, options?: firestore.SnapshotListenOptions): Observable<Action<DocumentSnapshot<T>>>{
  return fromRef<DocumentSnapshot<T>>(ref, options)
    .pipe(
      map(payload => ({ payload, type: 'value' }))
    );
}

export function fromCollectionRef<T>(ref: Query, options?: firestore.SnapshotListenOptions): Observable<Action<QuerySnapshot<T>>> {
  return fromRef<QuerySnapshot<T>>(ref, options).pipe(
    map(payload => ({ payload, type: 'query' }))
  );
}
