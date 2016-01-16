import {Inject, OpaqueToken, provide} from 'angular2/core';
import * as Firebase from 'firebase';

export const DEFAULT_FIREBASE = new OpaqueToken('DEFAULT_FIREBASE');
export const DEFAULT_FIREBASE_REF = new OpaqueToken('DEFAULT_FIREBASE_REF')

export const FIREBASE_PROVIDERS:any[] = [
  provide(DEFAULT_FIREBASE_REF, {
    useFactory: (url:string) => new Firebase(url),
    deps: [DEFAULT_FIREBASE]})
];
