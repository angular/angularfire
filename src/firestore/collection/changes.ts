import { fromCollectionRef } from '../observable/fromRef';
import { Query, DocumentChangeType, DocumentChange } from '@firebase/firestore-types';
import { Observable } from 'rxjs';
import { map, filter, scan } from 'rxjs/operators';

import { DocumentChangeAction, Action } from '../interfaces';

/**
 * Return a stream of document changes on a query. These results are not in sort order but in
 * order of occurence.
 * @param query
 */
export function docChanges(query: Query): Observable<DocumentChangeAction[]> {
  return fromCollectionRef(query)
    .pipe(
      map(action =>
        action.payload.docChanges()
          .map(change => ({ type: change.type, payload: change }))));
}

/**
 * Return a stream of document changes on a query. These results are in sort order.
 * @param query
 */
export function sortedChanges(query: Query, events: DocumentChangeType[]): Observable<DocumentChangeAction[]> {
  return fromCollectionRef(query)
    .pipe(
      map(changes => changes.payload.docChanges()),
      scan((current, changes) => combineChanges(current, changes, events), []),
      map(changes => changes.map(c => ({ type: c.type, payload: c }))));
}

/**
 * Combines the total result set from the current set of changes from an incoming set
 * of changes.
 * @param current
 * @param changes
 * @param events
 */
export function combineChanges(current: DocumentChange[], changes: DocumentChange[], events: DocumentChangeType[]) {
  changes.forEach(change => {
    // skip unwanted change types
    if(events.indexOf(change.type) > -1) {
      current = combineChange(current, change);
    }
  });
  return current;
}

/**
 * Creates a new sorted array from a new change.
 * @param combined
 * @param change
 */
export function combineChange(combined: DocumentChange[], change: DocumentChange): DocumentChange[] {
  switch(change.type) {
    case 'added':
      if (combined[change.newIndex] && combined[change.newIndex].doc.id == change.doc.id) {
        // Not sure why the duplicates are getting fired
      } else {
        combined.splice(change.newIndex, 0, change);
      }
      break;
    case 'modified':
      // When an item changes position we first remove it
      // and then add it's new position
      if(change.oldIndex !== change.newIndex) {
        combined.splice(change.oldIndex, 1);
        combined.splice(change.newIndex, 0, change);
      } else {
        combined.splice(change.newIndex, 1, change);
      }
      break;
    case 'removed':
      combined.splice(change.oldIndex, 1);
      break;
  }
  return combined;
}
