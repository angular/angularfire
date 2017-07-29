import * as firebase from 'firebase/app';
import { ZoneScheduler } from 'angularfire2';
import * as utils from './utils';
import 'firebase/database';
import { AFUnwrappedDataSnapshot } from './interfaces';
import { FirebaseListObservable } from './firebase_list_observable';
import { Observer } from 'rxjs/Observer';
import { observeOn } from 'rxjs/operator/observeOn';
import { observeQuery } from './query_observable';
import { Query, FirebaseListFactoryOpts, DatabaseReference, DatabaseQuery, DatabaseSnapshot } from './interfaces';
import { switchMap } from 'rxjs/operator/switchMap';
import { map } from 'rxjs/operator/map';

export function FirebaseListFactory (
  ref: DatabaseReference,
  { preserveSnapshot, query = {} } :FirebaseListFactoryOpts = {}): FirebaseListObservable<any> {

  if (utils.isEmptyObject(query)) {
    return firebaseListObservable(ref, { preserveSnapshot });
  }

  const queryObs = observeQuery(query);
  return new FirebaseListObservable(ref, subscriber => {
    let sub = switchMap.call(map.call(queryObs, query => {
      let queried: DatabaseQuery = ref;
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
        if (utils.hasKey(query.equalTo, "value")) {
          queried = queried.equalTo(query.equalTo.value, query.equalTo.key);
        } else {
          queried = queried.equalTo(query.equalTo);
        }

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
        if (utils.hasKey(query.startAt, "value")) {
          queried = queried.startAt(query.startAt.value, query.startAt.key);
        } else {
          queried = queried.startAt(query.startAt);
        }
      }

      if (utils.hasKey(query, "endAt")) {
        if (utils.hasKey(query.endAt, "value")) {
          queried = queried.endAt(query.endAt.value, query.endAt.key);
        } else {
          queried = queried.endAt(query.endAt);
        }
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
 * Creates a FirebaseListObservable from a reference or query. Options can be provided as a second
 * parameter. This function understands the nuances of the Firebase SDK event ordering and other
 * quirks. This function takes into account that not all .on() callbacks are guaranteed to be
 * asynchonous. It creates a initial array from a promise of ref.once('value'), and then starts
 * listening to child events. When the initial array is loaded, the observable starts emitting values.
 */
function firebaseListObservable(ref: firebase.database.Reference | DatabaseQuery, {preserveSnapshot}: FirebaseListFactoryOpts = {}): FirebaseListObservable<any> {

  const toValue = preserveSnapshot ? (snapshot => snapshot) : utils.unwrapMapFn;
  const toKey = preserveSnapshot ? (value => value.key) : (value => value.$key);

  const listObs = new FirebaseListObservable(ref, (obs: Observer<any>) => {

    // Keep track of callback handles for calling ref.off(event, handle)
    const handles: { event: string, handle: (a: DatabaseSnapshot, b?: string | null | undefined) => any }[] = [];
    let hasLoaded = false;
    let lastLoadedKey: string = null!;
    let array: DatabaseSnapshot[] = [];

    // The list children are always added to, removed from and changed within
    // the array using the child_added/removed/changed events. The value event
    // is only used to determine when the initial load is complete.

    ref.once('value', (snap: any) => {
      if (snap.exists()) {
        snap.forEach((child: any) => {
          lastLoadedKey = child.key;
        });
        if (array.find((child: any) => toKey(child) === lastLoadedKey)) {
          hasLoaded = true;
          obs.next(array);
        }
      } else {
        hasLoaded = true;
        obs.next(array);
      }
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });

    const addFn = ref.on('child_added', (child: any, prevKey: string) => {
      array = onChildAdded(array, toValue(child), toKey, prevKey);
      if (hasLoaded) {
        obs.next(array);
      } else if (child.key === lastLoadedKey) {
        hasLoaded = true;
        obs.next(array);
      }
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });
    handles.push({ event: 'child_added', handle: addFn });

    let remFn = ref.on('child_removed', (child: any) => {
      array = onChildRemoved(array, toValue(child), toKey);
      if (hasLoaded) {
        obs.next(array);
      }
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });
    handles.push({ event: 'child_removed', handle: remFn });

    let chgFn = ref.on('child_changed', (child: any, prevKey: string) => {
      array = onChildChanged(array, toValue(child), toKey, prevKey);
      if (hasLoaded) {
        obs.next(array);
      }
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });
    handles.push({ event: 'child_changed', handle: chgFn });

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
  return observeOn.call(listObs, new ZoneScheduler(Zone.current));
}

export function onChildAdded(arr:any[], child:any, toKey:(element:any)=>string, prevKey:string): any[] {
  if (!arr.length) {
    return [child];
  }
  return arr.reduce((accumulator: DatabaseSnapshot[], curr: DatabaseSnapshot, i:number) => {
    if (!prevKey && i===0) {
      accumulator.push(child);
    }
    accumulator.push(curr);
    if (prevKey && prevKey === toKey(curr)) {
      accumulator.push(child);
    }
    return accumulator;
  }, []);
}

export function onChildChanged(arr:any[], child:any, toKey:(element:any)=>string, prevKey:string): any[] {
  const childKey = toKey(child);
  return arr.reduce((accumulator:any[], val:any, i:number) => {
    const valKey = toKey(val);
    if (!prevKey && i==0) {
      accumulator.push(child);
      if (valKey !== childKey) {
        accumulator.push(val);
      }
    } else if(valKey === prevKey) {
      accumulator.push(val);
      accumulator.push(child);
    } else if (valKey !== childKey) {
      accumulator.push(val);
    }
    return accumulator;
  }, []);
}

export function onChildRemoved(arr:any[], child:any, toKey:(element:any)=>string): any[] {
  let childKey = toKey(child);
  return arr.filter(c => toKey(c) !== childKey);
}

export function onChildUpdated(arr:any[], child:any, toKey:(element:any)=>string, prevKey:string): any[] {
  return arr.map((v, i, arr) => {
    if(!prevKey && !i) {
      return child;
    } else if (i > 0 && toKey(arr[i-1]) === prevKey) {
      return child;
    } else {
      return v;
    }
  });
}
