import { fromRef } from '../observable/fromRef';
import { Observable } from 'rxjs/Observable';
import { DatabaseQuery, ChildEvent, AngularFireAction, SnapshotAction } from '../interfaces';
import { isNil } from '../utils';

import 'rxjs/add/operator/scan';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/distinctUntilChanged';

export function listChanges<T>(ref: DatabaseQuery, events: ChildEvent[]): Observable<SnapshotAction[]> {
  return fromRef(ref, 'value', 'once').switchMap(snapshotAction => {
    const childEvent$ = [Observable.of(snapshotAction)];
    events.forEach(event => childEvent$.push(fromRef(ref, event)));
    return Observable.merge(...childEvent$).scan(buildView, [])
  })
  .distinctUntilChanged();
}

function positionFor(changes: SnapshotAction[], key) {
  const len = changes.length;
  for(let i=0; i<len; i++) {
    if(changes[i].payload.key === key) {
      return i;
    }
  }
  return -1;
}

function positionAfter(changes: SnapshotAction[], prevKey?: string) {
  if(isNil(prevKey)) { 
    return 0; 
  } else {
    const i = positionFor(changes, prevKey);
    if( i === -1) {
      return changes.length;
    } else {
      return i + 1;
    }
  }
}

function buildView(current, action) {
  const { payload, type, prevKey, key } = action; 
  const currentKeyPosition = positionFor(current, key);
  const afterPreviousKeyPosition = positionAfter(current, prevKey);
  switch (action.type) {
    case 'value':
      if (action.payload && action.payload.exists()) {
        let prevKey = null;
        action.payload.forEach(payload => {
          const action = {payload, type: 'value', prevKey, key: payload.key};
          prevKey = payload.key;
          current = [...current, action];
          return false;
        });
      }
      return current;
    case 'child_added':
      if (currentKeyPosition > -1) {
        // check that the previouskey is what we expect, else reorder
        const previous = current[currentKeyPosition - 1];
        if ((previous && previous.key || null) != prevKey) {
          current = current.filter(x => x.payload.key !== payload.key);
          current.splice(afterPreviousKeyPosition, 0, action);
        }
      } else if (prevKey == null) {
        return [action, ...current];
      } else {
        current = current.slice()
        current.splice(afterPreviousKeyPosition, 0, action);
      }
      return current;
    case 'child_removed':
      return current.filter(x => x.payload.key !== payload.key);
    case 'child_changed':
      return current.map(x => x.payload.key === key ? action : x);
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
}