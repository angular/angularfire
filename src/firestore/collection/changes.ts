import { fromCollectionRef } from '../observable/fromRef';
import { Observable, of } from 'rxjs';
import { map, filter, scan, tap, switchMap } from 'rxjs/operators';
import { firestore } from 'firebase/app';

import { Query, DocumentChangeType, DocumentChange, DocumentChangeAction, Action, QuerySnapshot, DocumentChangeOrMetadata } from '../interfaces';

/**
 * Return a stream of document changes on a query. These results are not in sort order but in
 * order of occurence.
 * @param query
 */
export function docChanges<T>(query: Query, options?: firestore.SnapshotListenOptions): Observable<DocumentChangeAction<T>[]> {
  return fromCollectionRef(query, options)
    .pipe(
      map(action =>
        action.payload.docChanges(options)
          .map(change => ({ type: change.type, payload: change } as DocumentChangeAction<T>))));
}

/**
 * Return a stream of document changes on a query. These results are in sort order.
 * @param query
 */
export function sortedChanges<T>(query: Query, events: DocumentChangeType[]): Observable<DocumentChangeAction<T>[]> {
  const options: firestore.SnapshotListenOptions = events.indexOf('metadata') > 0 ? { includeMetadataChanges: true } : {};
  let firstEmission = true;
  return fromCollectionRef(query, options)
    .pipe(
      map(changes => {
        const docChanges = changes.payload.docChanges(options);
        if (firstEmission) {
          return [{ type: 'value', payload: combineChanges([], docChanges, events) } as DocumentChangeOrMetadata<T>];
        } else if (docChanges.length > 0) {
          return docChanges;
        } else {
          return [{ type: 'metadata', payload: changes.payload.metadata } as DocumentChangeOrMetadata<T>];
        }
      }),
      tap(() => firstEmission = false),
      tap(change => console.log("change", change)),
      scan((current, changes) => combineChanges(current, changes, events), new Array<DocumentChange<T>>()),
      map(changes => changes.map(c => ({ type: c.type, payload: c } as DocumentChangeAction<T>))),
      tap(change => console.log("c&m", change)),
    );
}

/**
 * Combines the total result set from the current set of changes from an incoming set
 * of changes.
 * @param current
 * @param changes
 * @param events
 */
export function combineChanges<T>(current: DocumentChange<T>[], changes: DocumentChangeOrMetadata<T>[], events: DocumentChangeType[]) {
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
export function combineChange<T>(combined: DocumentChange<T>[], change: DocumentChangeOrMetadata<T>): DocumentChange<T>[] {
  if (change.type == 'value') { return change.payload }
  const next = [...combined];
  switch(change.type) {
    case 'added':
      if (next[change.newIndex] && next[change.newIndex].doc.id == change.doc.id) {
        // Not sure why the duplicates are getting fired
      } else {
        next.splice(change.newIndex, 0, change);
      }
      break;
    case 'modified':
      if (next[change.oldIndex] == null || next[change.oldIndex].doc.id == change.doc.id) {
        // When an item changes position we first remove it
        // and then add it's new position
        if(change.oldIndex !== change.newIndex) {
          next.splice(change.oldIndex, 1);
          next.splice(change.newIndex, 0, change);
        } else {
          next.splice(change.newIndex, 1, change);
        }
      }
      break;
    case 'removed':
      if (next[change.oldIndex] && next[change.oldIndex].doc.id == change.doc.id) {
        next.splice(change.oldIndex, 1);
      }
      break;
    case 'metadata':
      next.forEach(c => {
        (<any>c.doc.metadata) = change.payload;
      });
      break;
  }
  return next;
}
