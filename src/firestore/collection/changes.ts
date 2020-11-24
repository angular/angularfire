import { fromCollectionRef } from '../observable/fromRef';
import { Observable, of, SchedulerLike } from 'rxjs';
import { concatMap, distinctUntilChanged, map, pairwise, scan, startWith } from 'rxjs/operators';

import { DocumentChange, DocumentChangeAction, DocumentChangeType, Query } from '../interfaces';

/**
 * Return a stream of document changes on a query. These results are not in sort order but in
 * order of occurence.
 */
export function docChanges<T>(query: Query, scheduler?: SchedulerLike): Observable<DocumentChangeAction<T>[]> {
  return fromCollectionRef(query, scheduler)
    .pipe(
      startWith(undefined),
      pairwise(),
      map(([priorAction, action]) => {
        const docChanges = action.payload.docChanges();
        // if it's the first fire from the cache it's not added
        const overrideAsModified = !priorAction && action.payload.metadata.fromCache;
        const ret = docChanges.map(change => {
          if (overrideAsModified) {
            return {
              type: 'modified', payload: {
                oldIndex: change.oldIndex,
                newIndex: change.newIndex,
                type: 'modified',
                doc: change.doc,
              }
            };
          } else {
            return { type: change.type, payload: change };
          }
        });
        if (priorAction && JSON.stringify(priorAction.payload.metadata) !== JSON.stringify(action.payload.metadata)) {
          return [ret, action.payload.docs.map((it, i) => {
            const docChange = docChanges.find(d => d.doc.ref.isEqual(it.ref));
            const priorDoc = priorAction?.payload.docs.find(d => d.ref.isEqual(it.ref));
            if (!docChange && priorDoc && JSON.stringify(priorDoc.metadata) === JSON.stringify(it.metadata)) {
              return null;
            }
            return {
              type: 'modified',
              payload: {
                oldIndex: i,
                newIndex: i,
                type: 'modified',
                doc: it
              }
            } as DocumentChangeAction<T>;
          }).filter(it => !!it)];
        }
        return [ret as DocumentChangeAction<T>[]];
      }),
      concatMap(it => of(...it) as Observable<DocumentChangeAction<T>[]>),
  );
}

/**
 * Return a stream of document changes on a query. These results are in sort order.
 */
export function sortedChanges<T>(
  query: Query,
  events: DocumentChangeType[],
  scheduler?: SchedulerLike): Observable<DocumentChangeAction<T>[]> {
  return docChanges<T>(query, scheduler)
    .pipe(
      scan((current, changes) => combineChanges<T>(current, changes.map(it => it.payload), events), []),
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
    case 'modified':
      // OldIndex == -1 is added, since we added modified if fromCache, skip over, don't break
      if (change.oldIndex > -1) {
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
      }
    // tslint:disable-next-line:no-switch-case-fall-through
    case 'added':
      if (combined[change.newIndex] && combined[change.newIndex].doc.ref.isEqual(change.doc.ref)) {
        // Not sure why the duplicates are getting fired
      } else {
        return sliceAndSplice(combined, change.newIndex, 0, change);
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
