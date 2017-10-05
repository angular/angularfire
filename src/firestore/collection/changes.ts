import { fromCollectionRef } from '../observable/fromRef';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/shareReplay';

import { DocumentChangeAction, Action } from '../interfaces';

/**
 * Return a stream of document changes on a query. These results are not in sort order but in
 * order of occurence. 
 * @param query 
 */
export function docChanges(query: firebase.firestore.Query): Observable<DocumentChangeAction[]> {
  return fromCollectionRef(query)
    .filter(action => !!action)
    .map(action => 
      action.payload.docChanges
        .map(change => ({ type: change.type, payload: change })));
}

/**
 * Return a stream of document changes on a query. These results are in sort order.
 * @param query 
 */
export function sortedChanges(query: firebase.firestore.Query, events: firebase.firestore.DocumentChangeType[]): Observable<DocumentChangeAction[]> {
  return fromCollectionRef(query)
    .map(changes => changes && changes.payload.docChanges)
    .scan((current, changes) => combineChanges(current, changes, events), [])
    .map(changes => changes.map(c => ({ type: c.type, payload: c })))
    .shareReplay(1);
}

/**
 * Combines the total result set from the current set of changes from an incoming set
 * of changes.
 * @param current 
 * @param changes 
 * @param events
 */
export function combineChanges(current: firebase.firestore.DocumentChange[], changes: firebase.firestore.DocumentChange[] | undefined, events: firebase.firestore.DocumentChangeType[]) {
  if (changes) {
    changes.forEach(change => {
      // skip unwanted change types
      if(events.indexOf(change.type) > -1) {
        current = combineChange(current, change);
      }
    });
    return current;
  } else {
    // in the case of undefined, empty current
    // if you do odd things with the subscribes/unsubscrbes you can mess things
    // up and get double or tripled results
    return [];
  }
}

/**
 * Creates a new sorted array from a new change.
 * @param combined 
 * @param change 
 */
export function combineChange(combined: firebase.firestore.DocumentChange[], change: firebase.firestore.DocumentChange): firebase.firestore.DocumentChange[] {
  switch(change.type) {
    case 'added': 
      combined.splice(change.newIndex, 0, change);
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
