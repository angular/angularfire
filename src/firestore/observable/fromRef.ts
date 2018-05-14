import { DocumentReference, Query } from '@firebase/firestore-types';
import { Observable, Subscriber } from 'rxjs';
import { Action, Reference, DocumentSnapshot, QuerySnapshot } from '../interfaces';
import { map, share } from 'rxjs/operators';

function _fromRef<T, R>(ref: Reference<T>): Observable<R> {
  return new Observable(subscriber => {
    const unsubscribe = ref.onSnapshot(subscriber);
    return { unsubscribe };
  });
}

export function fromRef<R>(ref: DocumentReference | Query) {
  return _fromRef<typeof ref, R>(ref).pipe(share());
}

export function fromDocRef<T>(ref: DocumentReference): Observable<Action<DocumentSnapshot<T>>>{
  return fromRef<DocumentSnapshot<T>>(ref)
    .pipe(
      map(payload => ({ payload, type: 'value' }))
    );
}

export function fromCollectionRef<T>(ref: Query): Observable<Action<QuerySnapshot<T>>> {
  return fromRef<QuerySnapshot<T>>(ref).pipe(map(payload => ({ payload, type: 'query' })));
}
