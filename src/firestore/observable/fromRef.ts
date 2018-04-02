import { DocumentReference, Query, QuerySnapshot, DocumentSnapshot } from '@firebase/firestore-types';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { Action, Reference } from '../interfaces';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/share';

function _fromRef<T, R>(ref: Reference<T>): Observable<R> {
  return new Observable(subscriber => {
    const unsubscribe = ref.onSnapshot(subscriber);
    return { unsubscribe };
  });
}

export function fromRef<R>(ref: DocumentReference | Query) {
  return _fromRef<typeof ref, R>(ref).share();
}

export function fromDocRef(ref: DocumentReference): Observable<Action<DocumentSnapshot>>{
  return fromRef<DocumentSnapshot>(ref)
    .map(payload => ({ payload, type: 'value' }));
}

export function fromCollectionRef(ref: Query): Observable<Action<QuerySnapshot>> {
  return fromRef<QuerySnapshot>(ref).map(payload => ({ payload, type: 'query' }))
}
