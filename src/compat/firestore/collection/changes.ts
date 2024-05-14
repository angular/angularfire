import firebase from 'firebase/compat/app';
import { Observable, SchedulerLike } from 'rxjs';
import { distinctUntilChanged, map, pairwise, scan, startWith } from 'rxjs/operators';
import { Action, DocumentChange, DocumentChangeAction, DocumentChangeType, Query, QuerySnapshot } from '../interfaces';
import { fromCollectionRef } from '../observable/fromRef';


type ActionTupe = [Action<QuerySnapshot<firebase.firestore.DocumentData>>, Action<QuerySnapshot<firebase.firestore.DocumentData>>]
/**
 * Return a stream of document changes on a query. These results are not in sort order but in
 * order of occurence.
 */
export function docChanges<T>(query: Query, scheduler?: SchedulerLike): Observable<DocumentChangeAction<T>[]> {
  return fromCollectionRef(query, scheduler)
    .pipe(
      startWith<Action<QuerySnapshot<firebase.firestore.DocumentData>>, undefined>(undefined),
      pairwise(),
      map((actionTuple: ActionTupe) => {
        const [priorAction, action] = actionTuple;
        const docChanges = action.payload.docChanges();
        const actions = docChanges.map(change => ({ type: change.type, payload: change }));
        // the metadata has changed from the prior emission
        if (priorAction && JSON.stringify(priorAction.payload.metadata) !== JSON.stringify(action.payload.metadata)) {
          // go through all the docs in payload and figure out which ones changed
          action.payload.docs.forEach((currentDoc, currentIndex) => {
            const docChange = docChanges.find(d => d.doc.ref.isEqual(currentDoc.ref));
            const priorDoc = priorAction?.payload.docs.find(d => d.ref.isEqual(currentDoc.ref));
            if (docChange && JSON.stringify(docChange.doc.metadata) === JSON.stringify(currentDoc.metadata) ||
              !docChange && priorDoc && JSON.stringify(priorDoc.metadata) === JSON.stringify(currentDoc.metadata)) {
              // document doesn't appear to have changed, don't log another action
            } else {
              // since the actions are processed in order just push onto the array
              actions.push({
                type: 'modified',
                payload: {
                  oldIndex: currentIndex,
                  newIndex: currentIndex,
                  type: 'modified',
                  doc: currentDoc
                }
              });
            }
          });
        }
        return actions as DocumentChangeAction<T>[];
      }),
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
 * Build our own because we allow filtering of action types ('added', 'removed', 'modified') before scanning
 * and so we have greater control over change detection (by breaking ===)
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
