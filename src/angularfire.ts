import {OpaqueToken, provide, Provider} from 'angular2/core';
import * as Firebase from 'firebase';

export const FirebaseUrl = new OpaqueToken('FirebaseUrl');
export const FirebaseRef = new OpaqueToken('FirebaseRef');

export const FIREBASE_PROVIDERS:any[] = [
  provide(FirebaseRef, {
    useFactory: (url:string) => new Firebase(url),
    deps: [FirebaseUrl]})
];

export const defaultFirebase = (url: string):Provider => {
  return provide(FirebaseUrl, {
    useValue: url
  });
};

export {FirebaseList, FirebaseListConfig} from './providers/firebase_list';
export {FirebaseObservable} from './utils/firebase_observable';

// Helps Angular-CLI automatically add providers
export default {
  providers: FIREBASE_PROVIDERS
}
