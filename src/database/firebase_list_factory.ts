import * as firebase from 'firebase';
import { AFUnwrappedDataSnapshot } from '../interfaces';
import { FirebaseListObservable } from './firebase_list_observable';
import { Observer } from 'rxjs/Observer';
import { observeOn } from 'rxjs/operator/observeOn';
import { observeQuery } from './query_observable';
import { Query, FirebaseListFactoryOpts } from '../interfaces';
import * as utils from '../utils';
import { mergeMap } from 'rxjs/operator/mergeMap';
import { map } from 'rxjs/operator/map';
import { Observable } from 'rxjs/Observable';

export function FirebaseListFactory(
  absoluteUrlOrDbRef: string |
    firebase.database.Reference |
    firebase.database.Query,
  {preserveSnapshot, query = {}}: FirebaseListFactoryOpts = {}): FirebaseListObservable<any> {

  let ref: firebase.database.Reference | firebase.database.Query;

  utils.checkForUrlOrFirebaseRef(absoluteUrlOrDbRef, {
    isUrl: () => ref = firebase.database().refFromURL(<string>absoluteUrlOrDbRef),
    isRef: () => ref = <firebase.database.Reference>absoluteUrlOrDbRef,
    isQuery: () => ref = <firebase.database.Query>absoluteUrlOrDbRef,
  });

  // if it's just a reference or string, create a regular list observable
  if ((utils.isFirebaseRef(absoluteUrlOrDbRef) ||
    utils.isString(absoluteUrlOrDbRef)) &&
    utils.isEmptyObject(query)) {
    return firebaseListObservable(ref, { preserveSnapshot });
  }

  const queryObs = observeQuery(query);
  return new FirebaseListObservable(ref, subscriber => {
    let sub = mergeMap.call(map.call(queryObs, query => {
      let queried: firebase.database.Query = ref;
      // Only apply the populated keys
      // apply ordering and available querying options
      // eg: ref.orderByChild('height').startAt(3)
      // Check orderBy
      if (query.orderByChild) {
        queried = queried.orderByChild(query.orderByChild);
      } else if (query.orderByKey) {
        queried = queried.orderByKey();
      } else if (query.orderByPriority) {
        queried = queried.orderByPriority();
      } else if (query.orderByValue) {
        queried = queried.orderByValue();
      }

      // check equalTo
      if (utils.hasKey(query, "equalTo")) {
        queried = queried.equalTo(query.equalTo);

        if (utils.hasKey(query, "startAt") || utils.hasKey(query, "endAt")) {
          throw new Error('Query Error: Cannot use startAt or endAt with equalTo.');
        }

        // apply limitTos
        if (!utils.isNil(query.limitToFirst)) {
          queried = queried.limitToFirst(query.limitToFirst);
        }

        if (!utils.isNil(query.limitToLast)) {
          queried = queried.limitToLast(query.limitToLast);
        }

        return queried;
      }

      // check startAt
      if (utils.hasKey(query, "startAt")) {
        queried = queried.startAt(query.startAt);
      }

      if (utils.hasKey(query, "endAt")) {
        queried = queried.endAt(query.endAt);
      }

      if (!utils.isNil(query.limitToFirst) && query.limitToLast) {
        throw new Error('Query Error: Cannot use limitToFirst with limitToLast.');
      }

      // apply limitTos
      if (!utils.isNil(query.limitToFirst)) {
        queried = queried.limitToFirst(query.limitToFirst);
      }

      if (!utils.isNil(query.limitToLast)) {
        queried = queried.limitToLast(query.limitToLast);
      }

      return queried;
    }), (queryRef: firebase.database.Reference, ix: number) => {
      return firebaseListObservable(queryRef, { preserveSnapshot });
    })
      .subscribe(subscriber);

    return () => sub.unsubscribe();
  });
}

/**
 * Creates a FirebaseListObservable from a reference or query. Options can be provided as a second parameter.
 * This function understands the nuances of the Firebase SDK event ordering and other quirks. This function
 * takes into account that not all .on() callbacks are guaranteed to be asynchonous. It creates a initial array
 * from a promise of ref.once('value'), and then starts listening to child events. When the initial array
 * is loaded, the observable starts emitting values.
 */
function firebaseListObservable(ref: firebase.database.Reference | firebase.database.Query, {preserveSnapshot}: FirebaseListFactoryOpts = {}): FirebaseListObservable<any> {
  // Keep track of callback handles for calling ref.off(event, handle)
  const handles = [];
  const listObs = new FirebaseListObservable(ref, (obs: Observer<any[]>) => {
    ref.once('value')
      .then((snap) => {
        let initialArray = [];
        snap.forEach(child => {
          initialArray.push(child)
        });
        return initialArray;
      })
      .then((initialArray) => {
        const isInitiallyEmpty = initialArray.length === 0;
        let hasInitialLoad = false;
        let lastKey;

        if (!isInitiallyEmpty) {
          // The last key in the initial array tells us where
          // to begin listening in realtime
          lastKey = initialArray[initialArray.length - 1].key;
        }

        const addFn = ref.on('child_added', (child: any, prevKey: string) => {
          // If the initial load has not been set and the current key is
          // the last key of the initialArray, we know we have hit the
          // initial load
          if (!isInitiallyEmpty) {
            if (child.key === lastKey) {
              hasInitialLoad = true;
              obs.next(preserveSnapshot ? initialArray : initialArray.map(utils.unwrapMapFn));
              return;
            }
          }

          if (hasInitialLoad) {
            initialArray = onChildAdded(initialArray, child, prevKey);
          }

          // only emit the array after the initial load
          if (hasInitialLoad) {
            obs.next(preserveSnapshot ? initialArray : initialArray.map(utils.unwrapMapFn));
          }
        }, err => {
          if (err) { obs.error(err); obs.complete(); }
        });

        handles.push({ event: 'child_added', handle: addFn });

        let remFn = ref.on('child_removed', (child: any) => {
          initialArray = onChildRemoved(initialArray, child)
          if (hasInitialLoad) {
            obs.next(preserveSnapshot ? initialArray : initialArray.map(utils.unwrapMapFn));
          }
        }, err => {
          if (err) { obs.error(err); obs.complete(); }
        });
        handles.push({ event: 'child_removed', handle: remFn });

        let chgFn = ref.on('child_changed', (child: any, prevKey: string) => {
          initialArray = onChildChanged(initialArray, child, prevKey)
          if (hasInitialLoad) {
            // This also manages when the only change is prevKey change
            obs.next(preserveSnapshot ? initialArray : initialArray.map(utils.unwrapMapFn));
          }
        }, err => {
          if (err) { obs.error(err); obs.complete(); }
        });
        handles.push({ event: 'child_changed', handle: chgFn });

        // If empty emit the array
        if (isInitiallyEmpty) {
          obs.next(initialArray);
          hasInitialLoad = true;
        }
      });

    return () => {
      // Loop through callback handles and dispose of each event with handle
      // The Firebase SDK requires the reference, event name, and callback to
      // properly unsubscribe, otherwise it can affect other subscriptions.
      handles.forEach(item => {
        ref.off(item.event, item.handle);
      });
    };

  });

  // TODO: should be in the subscription zone instead
  return observeOn.call(listObs, new utils.ZoneScheduler(Zone.current));
}

export function onChildAdded(arr: any[], child: any, prevKey: string): any[] {
  if (!arr.length) {
    return [child];
  }

  return arr.reduce((accumulator: firebase.database.DataSnapshot[], curr: firebase.database.DataSnapshot, i: number) => {
    if (!prevKey && i === 0) {
      accumulator.push(child);
    }
    accumulator.push(curr);
    if (prevKey && prevKey === curr.key) {
      accumulator.push(child);
    }
    return accumulator;
  }, []);
}

export function onChildChanged(arr: any[], child: any, prevKey: string): any[] {
  return arr.reduce((accumulator: any[], val: any, i: number) => {
    if (!prevKey && i == 0) {
      accumulator.push(child);
      if (val.key !== child.key) {
        accumulator.push(val);
      }
    } else if (val.key === prevKey) {
      accumulator.push(val);
      accumulator.push(child);
    } else if (val.key !== child.key) {
      accumulator.push(val);
    }
    return accumulator;
  }, []);
}

export function onChildRemoved(arr: any[], child: any): any[] {
  return arr.filter(c => c.key !== child.key);
}

export function onChildUpdated(arr: any[], child: any, prevKey: string): any[] {
  return arr.map((v, i, arr) => {
    if (!prevKey && !i) {
      return child;
    } else if (i > 0 && arr[i - 1].key === prevKey) {
      return child;
    } else {
      return v;
    }
  });
}
