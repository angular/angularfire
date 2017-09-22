import { DocumentReference, CollectionReference, DocumentSnapshot, Query, QuerySnapshot } from 'firestore';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { Subscription } from 'rxjs/Subscription';
import { observeOn } from 'rxjs/operator/observeOn';
import { ZoneScheduler } from 'angularfire2';
import { Action, Reference } from '../interfaces';
import 'rxjs/add/operator/map';

function _fromRef<T, R>(ref: Reference<T>): Observable<R> {
  return new Observable(subscriber => {
    const unsubscribe = ref.onSnapshot(subscriber);
    return { unsubscribe };
  });
}

export function fromRef<R>(ref: DocumentReference | Query) {
  return _fromRef<typeof ref, R>(ref);
}

export function fromDocRef(ref: DocumentReference): Observable<Action<DocumentSnapshot>>{
  return fromRef<DocumentSnapshot>(ref)
    .map(payload => ({ payload, type: 'modified' }));
}

export function fromCollectionRef(ref: Query): Observable<Action<QuerySnapshot>> {
  return fromRef<QuerySnapshot>(ref).map(payload => ({ payload, type: 'query' }))
}
