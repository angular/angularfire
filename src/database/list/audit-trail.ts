import { DataSnapshot, DatabaseQuery, ChildEvent, DatabaseSnapshot, AngularFireAction, SnapshotAction } from '../interfaces';
import { stateChanges } from './state-changes';
import { Observable, SchedulerLike } from 'rxjs';
import { fromRef } from '../observable/fromRef';

import { skipWhile, withLatestFrom, map, scan } from 'rxjs/operators';

export function auditTrail<T>(query: DatabaseQuery, events?: ChildEvent[], scheduler?: SchedulerLike): Observable<SnapshotAction<T>[]> {
  const auditTrail$ = stateChanges<T>(query, events)
    .pipe(
      scan((current, action) => [...current, action], [])
    );
  return waitForLoaded<T>(query, auditTrail$, scheduler);
}

interface LoadedMetadata {
  data: AngularFireAction<DataSnapshot>;
  lastKeyToLoad: any;
}

function loadedData<T>(query: DatabaseQuery, scheduler?: SchedulerLike): Observable<LoadedMetadata> {
  // Create an observable of loaded values to retrieve the
  // known dataset. This will allow us to know what key to
  // emit the "whole" array at when listening for child events.
  return fromRef<T>(query, 'value', 'on', scheduler)
  .pipe(
    map(data => {
      // Store the last key in the data set
      let lastKeyToLoad;
      // Loop through loaded dataset to find the last key
      data.payload.forEach(child => {
        lastKeyToLoad = child.key; return false;
      });
      // return data set and the current last key loaded
      return { data, lastKeyToLoad };
    })
  );
}

function waitForLoaded<T>(query: DatabaseQuery, action$: Observable<SnapshotAction<T>[]>, scheduler?: SchedulerLike) {
  const loaded$ = loadedData<T>(query, scheduler);
  return loaded$
    .pipe(
      withLatestFrom(action$),
      // Get the latest values from the "loaded" and "child" datasets
      // We can use both datasets to form an array of the latest values.
      map(([loaded, actions]) => {
        // Store the last key in the data set
        let lastKeyToLoad = loaded.lastKeyToLoad;
        // Store all child keys loaded at this point
        const loadedKeys = actions.map(snap => snap.key);
        return { actions, lastKeyToLoad, loadedKeys }
      }),
      // This is the magical part, only emit when the last load key
      // in the dataset has been loaded by a child event. At this point
      // we can assume the dataset is "whole".
      skipWhile(meta => meta.loadedKeys.indexOf(meta.lastKeyToLoad) === -1),
      // Pluck off the meta data because the user only cares
      // to iterate through the snapshots
      map(meta => meta.actions)
    );
}
