import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';

export type FirebaseOperation = string | firebase.database.Reference | firebase.database.DataSnapshot;

export interface AngularFireList<T> {
  query: DatabaseQuery;
  valueChanges(events?: ChildEvent[]): Observable<T[]>;
  snapshotChanges(events?: ChildEvent[]): Observable<SnapshotAction[]>;
  stateChanges(events?: ChildEvent[]): Observable<SnapshotAction>;
  auditTrail(events?: ChildEvent[]): Observable<SnapshotAction[]>;
  update(item: FirebaseOperation, data: T): Promise<void>;
  set(item: FirebaseOperation, data: T): Promise<void>;
  push(data: T): firebase.database.ThenableReference;
  remove(item?: FirebaseOperation): Promise<void>;
}

export interface AngularFireObject<T> {
  query: DatabaseQuery;
  valueChanges(): Observable<T | null>;
  snapshotChanges(): Observable<SnapshotAction>;
  update(data: Partial<T>): Promise<void>;
  set(data: T): Promise<void>;
  remove(): Promise<void>;
}

export interface FirebaseOperationCases {
  stringCase: () => Promise<void>;
  firebaseCase?: () => Promise<void>;
  snapshotCase?: () => Promise<void>;
  unwrappedSnapshotCase?: () => Promise<void>;
}

export type QueryFn = (ref: DatabaseReference) => DatabaseQuery;
export type ChildEvent = 'child_added' | 'child_removed' | 'child_changed' | 'child_moved';
export type ListenEvent = 'value' | ChildEvent;

export interface Action<T> {
  type: ListenEvent;
  payload: T;
};

export interface AngularFireAction<T> extends Action<T> {
  prevKey: string | null | undefined;
  key: string | null;
}

export type SnapshotAction = AngularFireAction<DatabaseSnapshot>;

export type Primitive = number | string | boolean;

export type DatabaseSnapshot = firebase.database.DataSnapshot;
export type DatabaseReference = firebase.database.Reference;
export type DatabaseQuery = firebase.database.Query;
export type QueryReference = DatabaseReference | DatabaseQuery;
export type PathReference = QueryReference | string;
