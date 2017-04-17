import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';

export interface FirebaseOperationCases {
  stringCase: () => firebase.Promise<void>;
  firebaseCase?: () => firebase.Promise<void>;
  snapshotCase?: () => firebase.Promise<void>;
  unwrappedSnapshotCase?: () => firebase.Promise<void>;
}

export type UnwrapSnapshotSignature = (snapshot: firebase.database.DataSnapshot) => UnwrappedSnapshot;

export interface UnwrappedSnapshot {
  $key: string;
  $value?: string | number | boolean;
  $exists: () => boolean;
  [key: string]: any;
}

export interface Query {
  [key: string]: any;
  orderByKey?: boolean | Observable<boolean>;
  orderByPriority?: boolean | Observable<boolean>;
  orderByChild?: string | Observable<string>;
  orderByValue?: boolean | Observable<boolean>;
  equalTo?: any | Observable<any>;
  startAt?: any | Observable<any>;
  endAt?: any | Observable<any>;
  limitToFirst?: number | Observable<number>;
  limitToLast?: number | Observable<number>;
}

export interface ScalarQuery {
  [key: string]: any;
  orderByKey?: boolean;
  orderByPriority?: boolean;
  orderByChild?: string;
  orderByValue?: boolean;
  equalTo?: any;
  startAt?: any;
  endAt?: any;
  limitToFirst?: number;
  limitToLast?: number;
}

export interface OrderBySelection {
  key: OrderByOptions;
  value: boolean | string;
}

export interface LimitToSelection {
  key: LimitToOptions;
  value: number;
}

export interface FirebaseListFactoryOpts {
  preserveSnapshot?: boolean;
  query?: Query;
  unwrapSnapshot?: UnwrapSnapshotSignature;
}

export interface FirebaseObjectFactoryOpts {
  preserveSnapshot?: boolean;
  unwrapSnapshot?: UnwrapSnapshotSignature;
}

export enum OrderByOptions {
  Child,
  Key,
  Value,
  Priority
}

export enum LimitToOptions {
  First,
  Last
}

export enum QueryOptions {
  EqualTo,
  StartAt,
  EndAt
}

export type Primitive = number | string | boolean;

export type DatabaseSnapshot = firebase.database.DataSnapshot;
export type DatabaseReference = firebase.database.Reference;
export type DatabaseQuery = firebase.database.Query;
export type QueryReference = DatabaseReference | DatabaseQuery;
export type PathReference = QueryReference | string;
