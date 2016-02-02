import {FirebaseObservable} from './firebase_observable';
import {Observer} from 'rxjs/Observer';
import * as Firebase from 'firebase';

export function FirebaseListFactory (absoluteUrl:string): FirebaseObservable<any> {
  var ref = new Firebase(absoluteUrl);
  return new FirebaseObservable((obs:Observer<any[]>) => {
    var arr:any[] = [];

    ref.on('child_added', (child:any) => {
      obs.next(arr = onChildAdded(arr, child));
    });

    ref.on('child_removed', (child:any) => {
      obs.next(arr = onChildRemoved(arr, child));
    });

    ref.on('child_changed', (child:any, prevKey: string) => {
      // This also manages when the only change is prevKey change
      obs.next(arr = onChildChanged(arr, child, prevKey));
    });

    return ref.off;
  }, ref);
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
