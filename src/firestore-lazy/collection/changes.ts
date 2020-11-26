import { fromCollectionRef } from '../observable/fromRef';
import { Observable, SchedulerLike } from 'rxjs';
import { distinctUntilChanged, map, pairwise, scan, startWith } from 'rxjs/operators';

import { DocumentChange, DocumentChangeAction, DocumentChangeType, Query } from '../interfaces';

/**
 * Return a stream of document changes on a query. These results are not in sort order but in
 * order of occurence.
 */
export function docChanges<T>(query: Query, scheduler?: SchedulerLike): Observable<DocumentChangeAction<T>[]> {
  return fromCollectionRef(query, scheduler)
    .pipe(
      map(action =>
        action.payload.docChanges()
          .map(change => ({ type: change.type, payload: change } as DocumentChangeAction<T>))));
}

/**
 * Return a stream of document changes on a query. These results are in sort order.
 */
export function sortedChanges<T>(
  query: Query,
  events: DocumentChangeType[],
  scheduler?: SchedulerLike): Observable<DocumentChangeAction<T>[]> {
  return fromCollectionRef(query, scheduler)
    .pipe(
      startWith(undefined),
      pairwise(),
      scan((current, [priorChanges, changes]) => {
        const docChanges = changes.payload.docChanges();
        const ret = combineChanges(current, docChanges, events);
        // docChanges({ includeMetadataChanges: true }) does't include metadata changes... wat?
        if (events.indexOf('modified') > -1 && priorChanges &&
            JSON.stringify(priorChanges.payload.metadata) !== JSON.stringify(changes.payload.metadata)) {
          return ret.map(it => {
            const partOfDocChanges = !!docChanges.find(d => d.doc.ref.isEqual(it.doc.ref));
            return {
              // if it's not one of the changed docs that means we already saw it's order change
              // so this is purely metadata, so don't move the doc
              oldIndex: partOfDocChanges ? it.oldIndex : it.newIndex,
              newIndex: it.newIndex,
              type: 'modified',
              doc: changes.payload.docs.find(d => d.ref.isEqual(it.doc.ref))
            };
          });
        }
        return ret;
      }, []),
      distinctUntilChanged(), // cut down on unneed change cycles
      map(changes => changes.map(c => ({ type: c.type, payload: c } as DocumentChangeAction<T>))));
}

/**
 * Combines the total result set from the current set of changes from an incoming set
 * of changes.
 */
export function combineChanges<T>(current: DocumentChange<T>[], changes: DocumentChange<T>[], events: DocumentChangeType[]) {
  changes.forEach(change => {
    // skip unwanted change types
    if (events.indexOf(change.type) > -1) {
      current = combineChange(current, change);
    }
  });
  return current;
}

/**
 * Splice arguments on top of a sliced array, to break top-level ===
 * this is useful for change-detection
 */
function sliceAndSplice<T>(
  original: T[],
  start: number,
  deleteCount: number,
  ...args: T[]
): T[] {
  const returnArray = original.slice();
  returnArray.splice(start, deleteCount, ...args);
  return returnArray;
}

/**
 * Creates a new sorted array from a new change.
 */
export function combineChange<T>(combined: DocumentChange<T>[], change: DocumentChange<T>): DocumentChange<T>[] {
  switch (change.type) {
    case 'added':
      if (combined[change.newIndex] && combined[change.newIndex].doc.ref.isEqual(change.doc.ref)) {
        // Not sure why the duplicates are getting fired
      } else {
        return sliceAndSplice(combined, change.newIndex, 0, change);
      }
      break;
    case 'modified':
      if (combined[change.oldIndex] == null || combined[change.oldIndex].doc.ref.isEqual(change.doc.ref)) {
        // When an item changes position we first remove it
        // and then add it's new position
        if (change.oldIndex !== change.newIndex) {
          const copiedArray = combined.slice();
          copiedArray.splice(change.oldIndex, 1);
          copiedArray.splice(change.newIndex, 0, change);
          return copiedArray;
        } else {
          return sliceAndSplice(combined, change.newIndex, 1, change);
        }
      }
      break;
    case 'removed':
      if (combined[change.oldIndex] && combined[change.oldIndex].doc.ref.isEqual(change.doc.ref)) {
        return sliceAndSplice(combined, change.oldIndex, 1);
      }
      break;
  }
  return combined;
}
