import { fromRef } from '../observable/fromRef';
import { Observable } from 'rxjs/Observable';
import { DatabaseQuery, ChildEvent, SnapshotChange} from '../interfaces';
import { positionFor, positionAfter } from './utils';
import 'rxjs/add/operator/scan';
import 'rxjs/add/observable/merge';

// TODO(davideast): check safety of ! operator in scan
export function listChanges<T>(ref: DatabaseQuery, events: ChildEvent[]): Observable<SnapshotChange[]> {
  const childEvent$ = events.map(event => fromRef(ref, event));
  return Observable.merge(...childEvent$)
  .scan((current, change) => {
    const { snapshot, event } = change; 
    switch (change.event) {
      case 'child_added':
        return [...current, change];
      case 'child_removed':
        // ! is okay here because only value events produce null results
        return current.filter(x => x.snapshot!.key !== snapshot!.key);
      case 'child_changed':
        return current.map(x => x.snapshot!.key === change.snapshot!.key ? change : x);
      // default will also remove null results
      case 'child_moved':
        const curPos = positionFor(current, change.snapshot!.key)
        if(curPos > -1) {
          const data = current.splice(curPos, 1)[0];
          const newPost = positionAfter(current, change.prevKey!);
          current.splice(newPost, 0, data);
          return current;
        }
        return current;
      default:
        return current;
    }
  }, []);
}
