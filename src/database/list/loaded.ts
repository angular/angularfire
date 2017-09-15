import { DatabaseQuery, ChildEvent, DatabaseSnapshot } from '../interfaces';
import { fromRef } from '../observable/fromRef';
import { createListSnapshotChanges } from './snapshot-changes';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/skipWhile';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/filter';
import { database } from 'firebase/app';

/**
 * Creates a function that creates a "loaded observable".
 * A "loaded observable" waits until the final child emissions are
 * complete and match the last key in the dataset before emitting
 * the "whole" array. Realtime updates can continue to apply to the
 * array, but by leveraging skipWhile, we wait until the first value
 * set is "whole" so the user is inundated with child_added updates.
 * @param query 
 */
export function createLoadedChanges(query: DatabaseQuery) {
  // Create an observable of loaded values to retrieve the
  // known dataset. This will allow us to know what key to
  // emit the "whole" array at when listening for child events.
  const loaded$ = fromRef(query, 'value')
    .map(data => {
      // Store the last key in the data set
      let lastKeyToLoad;
      // Loop through loaded dataset to find the last key
      data.snapshot!.forEach(child => {
        lastKeyToLoad = child.key; return false;
      });
      // return data set 
      return { data, lastKeyToLoad };
    });
  return function snapshotChanges(events?: ChildEvent[]) {
    const snapChanges$ = createListSnapshotChanges(query)(events);
    return loaded$
      .withLatestFrom(snapChanges$)
      // Get the latest values from the "loaded" and "child" datasets
      // This way 
      .map(([loaded, snaps]) => {
        // Store the last key in the data set
        let lastKeyToLoad = loaded.lastKeyToLoad;
        // Store all child keys loaded at this point
        const loadedKeys = snaps.map(snap => snap.key);
        return { snaps, lastKeyToLoad, loadedKeys }
      })
      // This is the magical part, only emit when the last load key
      // in the dataset has been loaded by a child event. At this point
      // we can assume the dataset is "whole".
      .skipWhile(meta => meta.loadedKeys.indexOf(meta.lastKeyToLoad) === -1)
      // Pluck off the meta data because the user only cares
      // to iterate through the snapshots
      .map(meta => meta.snaps);
  }
}
