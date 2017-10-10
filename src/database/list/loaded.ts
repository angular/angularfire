import { DatabaseQuery, ChildEvent, DatabaseSnapshot, AngularFireAction, SnapshotAction } from '../interfaces';
import { fromRef } from '../observable/fromRef';
import { snapshotChanges } from './snapshot-changes';
import { database } from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/skipWhile';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/map';

/**
 * Creates a function that creates a "loaded observable".
 * A "loaded observable" waits until the final child emissions are
 * complete and match the last key in the dataset before emitting
 * the "whole" array. Realtime updates can continue to apply to the
 * array, but by leveraging skipWhile, we wait until the first value
 * set is "whole" so the user is inundated with child_added updates.
 * @param query 
 */
export function createLoadedChanges(query: DatabaseQuery): (events?: ChildEvent[]) => Observable<SnapshotAction[]> {
  return (events?: ChildEvent[]) => loadedSnapshotChanges(query, events);
}

export interface LoadedMetadata {
  data: AngularFireAction<database.DataSnapshot | null>;
  lastKeyToLoad: any;
}

export function loadedData(query: DatabaseQuery): Observable<LoadedMetadata> {
  // Create an observable of loaded values to retrieve the
  // known dataset. This will allow us to know what key to
  // emit the "whole" array at when listening for child events.
  return fromRef(query, 'value')
  .map(data => {
    // Store the last key in the data set
    let lastKeyToLoad;
    // Loop through loaded dataset to find the last key
    data.payload!.forEach(child => {
      lastKeyToLoad = child.key; return false;
    });
    console.log(data, lastKeyToLoad);
    // return data set and the current last key loaded
    return { data, lastKeyToLoad };
  });
}

export function waitForLoaded(query: DatabaseQuery, action$: Observable<SnapshotAction[]>) {
  const loaded$ = loadedData(query);
  return loaded$
    .withLatestFrom(action$)
    // Get the latest values from the "loaded" and "child" datasets
    // We can use both datasets to form an array of the latest values.
    .map(([loaded, actions]) => {
      // Store the last key in the data set
      let lastKeyToLoad = loaded.lastKeyToLoad;
      // Store all child keys loaded at this point
      const loadedKeys = actions.map(snap => snap.key);
      console.log(actions, lastKeyToLoad, loadedKeys);
      return { actions, lastKeyToLoad, loadedKeys }
    })
    // This is the magical part, only emit when the last load key
    // in the dataset has been loaded by a child event. At this point
    // we can assume the dataset is "whole".
    .skipWhile(meta => meta.loadedKeys.indexOf(meta.lastKeyToLoad) === -1)
    // Pluck off the meta data because the user only cares
    // to iterate through the snapshots
    .map(meta => meta.actions);  
}

export function loadedSnapshotChanges(query: DatabaseQuery, events?: ChildEvent[]): Observable<SnapshotAction[]> {
  const snapChanges$ = snapshotChanges(query, events);
  return waitForLoaded(query, snapChanges$);
}
