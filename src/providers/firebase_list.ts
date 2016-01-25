import {Provider} from 'angular2/core';
import {FirebaseUrl} from '../angularfire';
import {Observer} from 'rxjs/Observer';
import {FirebaseObservable} from '../utils/firebase_observable';
import {absolutePathResolver} from '../utils/absolute_path_resolver';

export interface FirebaseListConfig {
  token?:any;
  path?: string;
}

export function FirebaseList (config?:FirebaseListConfig|string):Provider {
  var normalConfig = normalizeConfig(config);
  return new Provider(normalConfig.token, {
    useFactory: (defaultFirebase:string) => FirebaseListFactory(absolutePathResolver(defaultFirebase, normalConfig.path)),
    deps: [FirebaseUrl]
  })
}

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
  }, ref);
}

export function normalizeConfig(config?:FirebaseListConfig|string):FirebaseListConfig {
  switch (typeof config) {
    case 'string':
      // If string, it's just the path of the collection.
      // The path automatically becomes the injectable token
      let strConf:string = <string>config;
      return {
        token: strConf,
        path: strConf
      };
    case 'object':
      let conf:FirebaseListConfig = config;
      let token:any;
      if (conf.token) {
        token = conf.token;
      } else if (conf.path) {
        token = conf.path;
      } else {
        token = FirebaseList;
      }
      return {
        token: token,
        path: conf.path
      };
    default:
      // Presumably no config info provided, default to root
      return {
        token: FirebaseList,
        path: ''
      }
  }
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
