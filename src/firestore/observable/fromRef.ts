
import {map, share} from 'rxjs/operators';
import { DocumentReference, Query, QuerySnapshot, DocumentSnapshot } from '@firebase/firestore-types';
import { Observable ,  Subscriber } from 'rxjs';
import { Action, Reference } from '../interfaces';




function _fromRef<T, R>(ref: Reference<T>): Observable<R> {
  return new Observable(subscriber => {
    const unsubscribe = ref.onSnapshot(subscriber);
    return { unsubscribe };
  });
}

export function fromRef<R>(ref: DocumentReference | Query) {
  return _fromRef<typeof ref, R>(ref).pipe(share());
}

export function fromDocRef(ref: DocumentReference): Observable<Action<DocumentSnapshot>>{
  return fromRef<DocumentSnapshot>(ref).pipe(
    map(payload => ({ payload, type: 'value' })));
}

export function fromCollectionRef(ref: Query): Observable<Action<QuerySnapshot>> {
  return fromRef<QuerySnapshot>(ref).pipe(map(payload => ({ payload, type: 'query' })))
}
