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

import 'rxjs/add/operator/do';

import * as firebase from 'firebase/app';

// TODO(davideast): check safety of ! operator in scan
export function listChanges<T>(ref: DatabaseQuery, events: ChildEvent[]): Observable<SnapshotAction[]> {
  console.log("listChanges", ref.toJSON(), events);
  return Observable.fromPromise(ref.once('value'))
  .delay(0)
  .switchMap(snapshot => {
    const childEvent$ = new Array<Observable<SnapshotAction>>();
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        childEvent$.push(Observable.of({payload: child, type: 'child_added', prevKey: undefined, key: null}));
      });
    } else {
      childEvent$.push(Observable.of({payload: null, type: 'empty', prevKey: undefined, key: null}));
    }
    events.forEach(event => childEvent$.push(fromRef(ref, event)));
    console.log(childEvent$);
    return Observable.merge(...childEvent$)
    .scan((current, action) => {
      console.log("action", action.type, action.payload && action.payload.val());
      const { payload, type, prevKey, key } = action; 
      switch (action.type) {
        case 'child_added':
          return [...current, action];
        case 'child_removed':
          // ! is okay here because only value events produce null results
          return current.filter(x => x.payload!.key !== payload!.key);
        case 'child_changed':
          return current.map(x => x.payload!.key === key ? action : x);
        case 'child_moved':
          const curPos = positionFor(current, payload!.key)
          if(curPos > -1) {
            const data = current.splice(curPos, 1)[0];
            const newPost = positionAfter(current, prevKey);
            current.splice(newPost, 0, data);
            return current;
          }
          return current;
        // default will also remove null results
        default:
          return current;
      }
    }, [])
  })
  .do(actions => console.log("map", actions));
  //.map(actions => actions.filter(action => events.indexOf(action.type as ChildEvent) > -1));
}
