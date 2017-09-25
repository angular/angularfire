import { fromCollectionRef } from '../observable/fromRef';
import { Query, DocumentChangeType, DocumentChange, DocumentSnapshot, QuerySnapshot } from 'firestore';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/map';
import 'rxjs/add/operator/scan';

import { DocumentChangeAction, Action } from '../interfaces';

/**
 * Return a stream of document changes on a query. These results are not in sort order but in
 * order of occurence. 
 * @param query 
 */
export function docChanges(query: Query): Observable<DocumentChangeAction[]> {
  return fromCollectionRef(query)
    .map(action => 
      action.payload.docChanges
        .map(change => ({ type: change.type, payload: change })));
}

/**
 * Return a stream of document changes on a query. These results are in sort order.
 * @param query 
 */
export function sortedChanges(query: Query, events: DocumentChangeType[]): Observable<DocumentChangeAction[]> {
  return fromCollectionRef(query)
    .map(changes => changes.payload.docChanges)
    .scan((current, changes) => combineChanges(current, changes, events), [])
    .map(changes => changes.map(c => ({ type: c.type, payload: c })));
}

/**
 * Combines the total result set from the current set of changes from an incoming set
 * of changes.
 * @param current 
 * @param changes 
 * @param events
 */
export function combineChanges(current: DocumentChange[], changes: DocumentChange[], events: DocumentChangeType[]) {
  let combined: DocumentChange[] = [];
  changes.forEach(change => {
    // skip unwanted change types
    if(events.indexOf(change.type) > -1) {
      combined = combineChange(combined, change);
    }
  });
  return combined;
}

/**
 * Creates a new sorted array from a new change.
 * @param combined 
 * @param change 
 */
export function combineChange(combined: DocumentChange[], change: DocumentChange): DocumentChange[] {
  switch(change.type) {
    case 'added': 
      return [...combined, change];
    case 'modified': 
      return combined.map(x => x.doc.id === change.doc.id ? change : x);
    case 'removed':
      return combined.filter(x => x.doc.id !== change.doc.id);
  }
  return combined;
}

