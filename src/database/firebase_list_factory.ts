import { AFUnwrappedDataSnapshot } from '../interfaces';
import { FirebaseListObservable } from './firebase_list_observable';
import { Observer } from 'rxjs/Observer';
import { database } from 'firebase';
import { observeQuery } from './query_observable';
import { Query, FirebaseListFactoryOpts } from '../interfaces';
import * as utils from '../utils';
import { mergeMap } from 'rxjs/operator/mergeMap';
import { map } from 'rxjs/operator/map';

export function FirebaseListFactory (
  absoluteUrlOrDbRef:string |
  firebase.database.Reference |
  firebase.database.Query,
  {preserveSnapshot, query = {}}:FirebaseListFactoryOpts = {}): FirebaseListObservable<any> {

  let ref: firebase.database.Reference | firebase.database.Query;

  utils.checkForUrlOrFirebaseRef(absoluteUrlOrDbRef, {
    isUrl: () => ref = database().refFromURL(<string>absoluteUrlOrDbRef),
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
      if (utils.isPresent(query.equalTo)) {
          queried = queried.equalTo(query.equalTo);

        if (utils.isPresent(query.startAt) || query.endAt) {
          throw new Error('Query Error: Cannot use startAt or endAt with equalTo.');
        }

        // apply limitTos
        if (utils.isPresent(query.limitToFirst)) {
          queried = queried.limitToFirst(query.limitToFirst);
        }

        if (utils.isPresent(query.limitToLast)) {
          queried = queried.limitToLast(query.limitToLast);
        }

        return queried;
      }

      // check startAt
      if (utils.isPresent(query.startAt)) {
          queried = queried.startAt(query.startAt);
      }

      if (utils.isPresent(query.endAt)) {
          queried = queried.endAt(query.endAt);
      }

      if (utils.isPresent(query.limitToFirst) && query.limitToLast) {
        throw new Error('Query Error: Cannot use limitToFirst with limitToLast.');
      }

      // apply limitTos
      if (utils.isPresent(query.limitToFirst)) {
          queried = queried.limitToFirst(query.limitToFirst);
      }

      if (utils.isPresent(query.limitToLast)) {
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

function firebaseListObservable(ref: firebase.database.Reference | firebase.database.Query, {preserveSnapshot}: FirebaseListFactoryOpts = {}): FirebaseListObservable<any> {

  const listObs = new FirebaseListObservable(ref, (obs: Observer<any[]>) => {
    let arr: any[] = [];
    let hasInitialLoad = false;
    // The list should only emit after the initial load
    // comes down from the Firebase database, (e.g.) all
    // the initial child_added events have fired.
    // This way a complete array is emitted which leads
    // to better rendering performance
    ref.once('value', (snap) => {
      hasInitialLoad = true;
      obs.next(preserveSnapshot ? arr : arr.map(utils.unwrapMapFn));
    }).catch(err => {
      obs.error(err);
      obs.complete()
    });

    let addFn = ref.on('child_added', (child: any, prevKey: string) => {
      arr = onChildAdded(arr, child, prevKey);
      // only emit the array after the initial load
      if (hasInitialLoad) {
        obs.next(preserveSnapshot ? arr : arr.map(utils.unwrapMapFn));
      }
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });

    let remFn = ref.on('child_removed', (child: any) => {
      arr = onChildRemoved(arr, child)
      if (hasInitialLoad) {
        obs.next(preserveSnapshot ? arr : arr.map(utils.unwrapMapFn));
      }
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });

    let chgFn = ref.on('child_changed', (child: any, prevKey: string) => {
      arr = onChildChanged(arr, child, prevKey)
      if (hasInitialLoad) {
        // This also manages when the only change is prevKey change
        obs.next(preserveSnapshot ? arr : arr.map(utils.unwrapMapFn));
      }
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });

    return () => {
      ref.off('child_added', addFn);
      ref.off('child_removed', remFn);
      ref.off('child_changed', chgFn);
    }
  });
  return listObs;
}

export function onChildAdded(arr:any[], child:any, prevKey:string): any[] {
  if (!arr.length) {
    return [child];
  }

  return arr.reduce((accumulator:firebase.database.DataSnapshot[], curr:firebase.database.DataSnapshot, i:number) => {
    if (!prevKey && i===0) {
      accumulator.push(child);
    }
    accumulator.push(curr);
    if (prevKey && prevKey === curr.key) {
      accumulator.push(child);
    }
    return accumulator;
  }, []);
}

export function onChildChanged(arr:any[], child:any, prevKey:string): any[] {
  return arr.reduce((accumulator:any[], val:any, i:number) => {
    if (!prevKey && i==0) {
      accumulator.push(child);
      if (val.key !== child.key) {
        accumulator.push(val);
      }
    } else if(val.key === prevKey) {
      accumulator.push(val);
      accumulator.push(child);
    } else if (val.key !== child.key) {
      accumulator.push(val);
    }
    return accumulator;
  }, []);
}

export function onChildRemoved(arr:any[], child:any): any[] {
  return arr.filter(c => c.key !== child.key);
}

export function onChildUpdated(arr:any[], child:any, prevKey:string): any[] {
  return arr.map((v, i, arr) => {
    if(!prevKey && !i) {
      return child;
    } else if (i > 0 && arr[i-1].key === prevKey) {
      return child;
    } else {
      return v;
    }
  });
}
