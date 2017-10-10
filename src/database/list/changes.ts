import { fromRef } from '../observable/fromRef';
import { Observable } from 'rxjs/Observable';
import { DatabaseQuery, ChildEvent, SnapshotChange, AngularFireAction, SnapshotAction } from '../interfaces';
import { positionFor, positionAfter } from './utils';

import 'rxjs/add/operator/scan';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/distinctUntilChanged';

// TODO(davideast): check safety of ! operator in scan
export function listChanges<T>(ref: DatabaseQuery, events: ChildEvent[]): Observable<SnapshotAction[]> {
  return Observable.fromPromise(ref.once('value'))
  .delay(0)
  .switchMap(snapshot => {
    const childEvent$ = new Array<Observable<SnapshotAction>>();
    if (snapshot.exists()) {
      let finalKey = null;
      snapshot.forEach(payload => { finalKey = payload.key });
      snapshot.forEach(payload => {
        childEvent$.push(Observable.of({payload, type: 'child_added', prevKey: undefined, key: payload.key, loaded: payload.key == finalKey}));
      });
    } else {
      childEvent$.push(Observable.of({payload: null, type: 'empty', prevKey: undefined, key: null, loaded: true}));
    }
    events.forEach(event => childEvent$.push(fromRef(ref, event)));
    return Observable.merge(...childEvent$)
    .scan((current, action) => {
      const { payload, type, prevKey, key } = action; 
      const currentKeyPosition = positionFor(current, key);
      const afterPreviousKeyPosition = positionAfter(current, prevKey);
      switch (action.type) {
        case 'child_added':
          if (currentKeyPosition > -1) {
            return current;
          } else if (prevKey == null) {
            return [...current, action];
          } else {
            current = current.slice()
            current.splice(afterPreviousKeyPosition, 0, action);
            return current;
          }
        case 'child_removed':
          // ! is okay here because only value events produce null results
          return current.filter(x => x.payload!.key !== payload!.key);
        case 'child_changed':
          return current.map(x => x.payload!.key === key ? action : x);
        case 'child_moved':
          if(currentKeyPosition > -1) {
            const data = current.splice(currentKeyPosition, 1)[0];
            current = current.slice()
            current.splice(afterPreviousKeyPosition, 0, data);
            return current;
          }
          return current;
        // default will also remove null results
        default:
          return current;
      }
    }, [])
  })
  .distinctUntilChanged();
}
