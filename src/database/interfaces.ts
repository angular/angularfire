import { Observable } from 'rxjs';
import { Reference, ThenableReference, Query, DataSnapshot } from 'firebase/database';

export type FirebaseOperation = string | Reference | DataSnapshot;

export interface AngularFireList<T> {
  query: DatabaseQuery;
  valueChanges(events?: ChildEvent[], options?: {}): Observable<T[]>;
  valueChanges<K extends string>(events?: ChildEvent[], options?: {idField: K}): Observable<(T & {[T in K]?: string})[]>;
  snapshotChanges(events?: ChildEvent[]): Observable<SnapshotAction<T>[]>;
  stateChanges(events?: ChildEvent[]): Observable<SnapshotAction<T>>;
  auditTrail(events?: ChildEvent[]): Observable<SnapshotAction<T>[]>;
  update(item: FirebaseOperation, data: Partial<T>): Promise<void>;
  set(item: FirebaseOperation, data: T): Promise<void>;
  push(data: T): ThenableReference;
  remove(item?: FirebaseOperation): Promise<void>;
}

export interface AngularFireObject<T> {
  query: DatabaseQuery;
  valueChanges(): Observable<T | null>;
  snapshotChanges(): Observable<SnapshotAction<T>>;
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
}

export interface AngularFireAction<T> extends Action<T> {
  prevKey: string | null | undefined;
  key: string | null;
}

export type SnapshotAction<T> = AngularFireAction<DatabaseSnapshot<T>>;

export type Primitive = number | string | boolean;

export interface DatabaseSnapshotExists<T> extends DataSnapshot {
  exists(): true;
  val(): T;
  forEach(action: (a: DatabaseSnapshot<T>) => boolean): boolean;
}

export interface DatabaseSnapshotDoesNotExist<T> extends DataSnapshot {
  exists(): false;
  val(): null;
  forEach(action: (a: DatabaseSnapshot<T>) => boolean): boolean;
}

export type DatabaseSnapshot<T> = DatabaseSnapshotExists<T> | DatabaseSnapshotDoesNotExist<T>;

export type DatabaseReference = Reference;
export type DatabaseQuery = Query;
export { DataSnapshot };
export type QueryReference = DatabaseReference | DatabaseQuery;
export type PathReference = QueryReference | string;
