import { Observable } from 'rxjs';
import { database } from 'firebase/app';

export type Reference = database.Reference;
export type DataSnapshot = database.DataSnapshot;
export type ThenableReference = database.ThenableReference;

export interface FirebaseOperationCases {
  stringCase: () => Promise<void>;
  firebaseCase?: () => Promise<void>;
  snapshotCase?: () => Promise<void>;
  unwrappedSnapshotCase?: () => Promise<void>;
}

export interface AFUnwrappedDataSnapshot {
  $key: string;
  $value?: string | number | boolean;
  $exists: () => boolean;
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
}


export interface FirebaseObjectFactoryOpts {
  preserveSnapshot?: boolean;
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

export type DatabaseSnapshot = DataSnapshot;
export type DatabaseReference = Reference;
export type DatabaseQuery = database.Query;
export type QueryReference = DatabaseReference | DatabaseQuery;
export type PathReference = QueryReference | string;
