import {FirebaseListObservable} from './firebase_list_observable';
import {Observer} from 'rxjs/Observer';
import * as Firebase from 'firebase';

export function FirebaseListFactory (absoluteUrl:string, {preserveSnapshot}:FirebaseListFactoryOpts = {}): FirebaseListObservable<any> {
  const ref = new Firebase(absoluteUrl);
  return new FirebaseListObservable((obs:Observer<any[]>) => {
    let arr:any[] = [];
    let hasInitialLoad = false;
    
    // The list should only emit after the initial load 
    // comes down from the Firebase database, (e.g.) all
    // the initial child_added events have fired.
    // This way a complete array is emitted which leads
    // to better rendering performance
    ref.once('value', (snap) => {
      //console.log('once');
      hasInitialLoad = true;
      obs.next(preserveSnapshot ? arr : arr.map(unwrapMapFn));
    });

    ref.on('child_added', (child:any) => {
      //console.log('child_added')
      arr = onChildAdded(arr, child);
      // only emit the array after the initial load
      if (hasInitialLoad) {
        //console.log('emitting child added')
        obs.next(preserveSnapshot ? arr : arr.map(unwrapMapFn)); 
      }
    });

    ref.on('child_removed', (child:any) => {
      arr = onChildRemoved(arr, child)
      if (hasInitialLoad) {
        obs.next(preserveSnapshot ? arr : arr.map(unwrapMapFn));
      }
    });

    ref.on('child_changed', (child:any, prevKey: string) => {
      arr = onChildChanged(arr, child, prevKey)
      if (hasInitialLoad) {
        // This also manages when the only change is prevKey change
        obs.next(preserveSnapshot ? arr : arr.map(unwrapMapFn));
      }
    });

    return () => ref.off();
  }, ref);
}

export interface FirebaseListFactoryOpts {
  preserveSnapshot?: boolean;
}

function unwrapMapFn (snapshot:FirebaseDataSnapshot): any {
  return snapshot.val();
}

export function onChildAdded(arr:any[], child:any): any[] {
  var newArray = arr.slice();
  newArray.push(child);
  return newArray;
}

export function onChildChanged(arr:any[], child:any, prevKey:string): any[] {
  return arr.reduce((accumulator:any[], val:any, i:number) => {
    if (!prevKey && i==0) {
      accumulator.push(child);
      accumulator.push(val);
    } else if(val.key() === prevKey) {
      accumulator.push(val);
      accumulator.push(child);
    } else if (val.key() !== child.key()) {
      accumulator.push(val);
    }
    return accumulator;
  }, []);
}

export function onChildRemoved(arr:any[], child:any): any[] {
  return arr.filter(c => c.key() !== child.key());
}

export function onChildUpdated(arr:any[], child:any, prevKey:string): any[] {
  return arr.map((v, i, arr) => {
    if(!prevKey && !i) {
      return child;
    } else if (i > 0 && arr[i-1].key() === prevKey) {
      return child;
    } else {
      return v;
    }
  });
}
