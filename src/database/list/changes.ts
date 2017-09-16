import { fromRef } from '../observable/fromRef';
import { Observable } from 'rxjs/Observable';
import { DatabaseQuery, ChildEvent, SnapshotChange, Action} from '../interfaces';
import { positionFor, positionAfter } from './utils';
import 'rxjs/add/operator/scan';
import 'rxjs/add/observable/merge';

// TODO(davideast): check safety of ! operator in scan
export function listChanges<T>(ref: DatabaseQuery, events: ChildEvent[]): Observable<Action<any>[]> {
  const childEvent$ = events.map(event => fromRef(ref, event));
  return Observable.merge(...childEvent$)
  .scan((current, action) => {
    const { payload, type } = action; 
    switch (action.type) {
      case 'child_added':
        return [...current, action];
      case 'child_removed':
        // ! is okay here because only value events produce null results
        return current.filter(x => x.payload.snapshot!.key !== payload.snapshot!.key);
      case 'child_changed':
        return current.map(x => x.payload.snapshot!.key === payload.snapshot!.key ? action : x);
      // default will also remove null results
      case 'child_moved':
        const curPos = positionFor(current, payload.snapshot!.key)
        if(curPos > -1) {
          const data = current.splice(curPos, 1)[0];
          const newPost = positionAfter(current, payload.prevKey!);
          current.splice(newPost, 0, data);
          return current;
        }
        return current;
      default:
        return current;
    }
  }, []);
}
