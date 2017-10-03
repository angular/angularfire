import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { Subscription } from 'rxjs/Subscription';
import { observeOn } from 'rxjs/operator/observeOn';
import { ZoneScheduler } from 'angularfire2';
import { Action, Reference } from '../interfaces';
import 'rxjs/add/operator/map';

function _fromRef<T, R>(ref: Reference<T>): Observable<R> {
  const ref$ = new Observable(subscriber => {
    const unsubscribe = ref.onSnapshot({ includeQueryMetadataChanges: true }, subscriber);
    return { unsubscribe };
  });
  return observeOn.call(ref$, new ZoneScheduler(Zone.current));
}

export function fromRef<R>(ref: firebase.firestore.DocumentReference | firebase.firestore.Query) {
  return _fromRef<typeof ref, R>(ref);
}

export function fromDocRef(ref: firebase.firestore.DocumentReference): Observable<Action<firebase.firestore.DocumentSnapshot>>{
  return fromRef<firebase.firestore.DocumentSnapshot>(ref)
    .map(payload => ({ payload, type: 'value' }));
}

export function fromCollectionRef(ref: firebase.firestore.Query): Observable<Action<firebase.firestore.QuerySnapshot>> {
  return fromRef<firebase.firestore.QuerySnapshot>(ref).map(payload => ({ payload, type: 'query' }))
}
