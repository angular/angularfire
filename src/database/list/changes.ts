import { fromRef } from '../observable/fromRef';
import { Observable } from 'rxjs/Observable';
import { DatabaseQuery, ChildEvent, SnapshotChange, AngularFireAction, SnapshotAction } from '../interfaces';
import { buildView } from './utils';

import 'rxjs/add/operator/do';
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
  return fromRef(ref, 'value', 'once').switchMap(snapshotAction => {
    const childEvent$ = [Observable.of(snapshotAction)];
    events.forEach(event => childEvent$.push(fromRef(ref, event)));
    return Observable.merge(...childEvent$).scan(buildView, [])
  })
  .distinctUntilChanged();
}
