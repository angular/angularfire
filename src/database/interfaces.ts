import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';

export type FirebaseOperation = string | firebase.database.Reference | firebase.database.DataSnapshot;

export interface AngularFireList<T> {
  query: DatabaseQuery;
  valueChanges<T>(events?: ChildEvent[]): Observable<T[]>;
  snapshotChanges(events?: ChildEvent[]): Observable<SnapshotAction[]>;
  stateChanges(events?: ChildEvent[]): Observable<SnapshotAction>;
  auditTrail(events?: ChildEvent[]): Observable<SnapshotAction[]>;
  update(item: FirebaseOperation, data: T): Promise<void>;
  set(item: FirebaseOperation, data: T): Promise<void>;
  push(data: T): firebase.database.ThenableReference;
  remove(item?: FirebaseOperation): Promise<any>;
}

export interface AngularFireObject<T> {
  query: DatabaseQuery;
  valueChanges<T>(): Observable<T | null>;
  snapshotChanges<T>(): Observable<SnapshotAction>;
  update(data: T): Promise<any>;
  set(data: T): Promise<void>;
  remove(): Promise<any>;
}

export interface FirebaseOperationCases {
  stringCase: () => Promise<void | any>;
  firebaseCase?: () => Promise<void | any>;
  snapshotCase?: () => Promise<void | any>;
  unwrappedSnapshotCase?: () => Promise<void | any>;
}

export type QueryFn = (ref: DatabaseReference) => DatabaseQuery;
export type ChildEvent = 'child_added' | 'child_removed' | 'child_changed' | 'child_moved';
export type ListenEvent = 'value' | ChildEvent;

export type SnapshotChange = { 
  event: string; 
  snapshot: DatabaseSnapshot | null; 
  prevKey: string | undefined;
}

export interface Action<T> {
  type: ListenEvent;
  payload: T;
};

export interface AngularFireAction<T> extends Action<T> {
  prevKey: string | undefined;
  key: string | null;
}

export interface SnapshotPrevKey {
  snapshot: DatabaseSnapshot | null;
  prevKey: string | undefined;
}

export type SnapshotAction = AngularFireAction<DatabaseSnapshot | null>;

export type Primitive = number | string | boolean;

export type DatabaseSnapshot = firebase.database.DataSnapshot;
export type DatabaseReference = firebase.database.Reference;
export type DatabaseQuery = firebase.database.Query;
export type QueryReference = DatabaseReference | DatabaseQuery;
export type PathReference = QueryReference | string;
