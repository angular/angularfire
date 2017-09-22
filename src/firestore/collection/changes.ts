import { fromCollectionRef } from '../observable/fromRef';
import { Query, DocumentChangeType } from 'firestore';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/map';

import { DocumentChangeAction } from '../interfaces';

export function changes(query: Query): Observable<DocumentChangeAction[]> {
  return fromCollectionRef(query)
    .map(action => 
      action.payload.docChanges
        .map(change => ({ type: change.type, payload: change })));
}
