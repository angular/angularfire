import { Subscriber } from 'rxjs';
import firebase from 'firebase/app';

export type Settings =  firebase.firestore.Settings;
export type CollectionReference<T = DocumentData> = firebase.firestore.CollectionReference<T>;
export type DocumentReference<T = DocumentData> = firebase.firestore.DocumentReference<T>;
export type PersistenceSettings = firebase.firestore.PersistenceSettings;
export type DocumentChangeType = firebase.firestore.DocumentChangeType;
export type SnapshotOptions = firebase.firestore.SnapshotOptions;
export type FieldPath = firebase.firestore.FieldPath;
export type Query<T = DocumentData> = firebase.firestore.Query<T>;

export type SetOptions = firebase.firestore.SetOptions;
export type DocumentData = firebase.firestore.DocumentData;

export interface DocumentSnapshotExists<T> extends firebase.firestore.DocumentSnapshot {
  readonly exists: true;
  data(options?: SnapshotOptions): T;
}

export interface DocumentSnapshotDoesNotExist extends firebase.firestore.DocumentSnapshot {
  readonly exists: false;
  data(options?: SnapshotOptions): undefined;
  get(fieldPath: string | FieldPath, options?: SnapshotOptions): undefined;
}

export type DocumentSnapshot<T> = DocumentSnapshotExists<T> | DocumentSnapshotDoesNotExist;

export interface QueryDocumentSnapshot<T> extends firebase.firestore.QueryDocumentSnapshot {
  data(options?: SnapshotOptions): T;
}

export interface QuerySnapshot<T> extends firebase.firestore.QuerySnapshot {
  readonly docs: QueryDocumentSnapshot<T>[];
}

export interface DocumentChange<T> extends firebase.firestore.DocumentChange {
  readonly doc: QueryDocumentSnapshot<T>;
}

export interface DocumentChangeAction<T> {
  type: DocumentChangeType;
  payload: DocumentChange<T>;
}

export interface Action<T> {
  type: string;
  payload: T;
}

export interface Reference<T> {
  onSnapshot: (options: firebase.firestore.SnapshotListenOptions, sub: Subscriber<any>) => any;
}

// A convience type for making a query.
// Example: const query = (ref) => ref.where('name', == 'david');
export type QueryFn<T = DocumentData> = (ref: CollectionReference<T>) => Query<T>;

export type QueryGroupFn<T = DocumentData> = (query: Query<T>) => Query<T>;

/**
 * A structure that provides an association between a reference
 * and a query on that reference. Note: Performing operations
 * on the reference can lead to confusing results with complicated
 * queries.
 *
 * Example:
 *
 * const query = ref.where('type', '==', 'Book').
 *                  .where('price', '>' 18.00)
 *                  .where('price', '<' 100.00)
 *                  .where('category', '==', 'Fiction')
 *                  .where('publisher', '==', 'BigPublisher')
 *
 * // This addition would not be a result of the query above
 * ref.add({
 *  type: 'Magazine',
 *  price: 4.99,
 *  category: 'Sports',
 *  publisher: 'SportsPublisher'
 * });
 */
export interface AssociatedReference<T = DocumentData> {
  ref: CollectionReference<T>;
  query: Query<T>;
}
