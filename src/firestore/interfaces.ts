import {
  FieldPath,
  CollectionReference,
  DocumentReference,
  Query,
  DocumentChangeType,
  DocumentData,
  DocumentChange,
  DocumentSnapshot as FirebaseDocumentSnapshot,
  SnapshotOptions
} from 'firebase/firestore';

export interface DocumentSnapshotExists<T> extends FirebaseDocumentSnapshot {
  exists(): true;
  data(options?: SnapshotOptions): T;
}

export interface DocumentSnapshotDoesNotExist extends FirebaseDocumentSnapshot {
  exists(): false;
  data(options?: SnapshotOptions): undefined;
  get(fieldPath: string | FieldPath, options?: SnapshotOptions): undefined;
}

export type DocumentSnapshot<T> = DocumentSnapshotExists<T> | DocumentSnapshotDoesNotExist;

// No longer in v0.900
export interface GetOptions {
  readonly source?: 'default' | 'server' | 'cache';
}

export interface DocumentChangeAction<T> {
  type: DocumentChangeType;
  payload: DocumentChange<T>;
}

export interface Action<T> {
  type: string;
  payload: T;
}

export type Reference<T = DocumentData> = DocumentReference<T> & Query<T>;

// A convience type for making a query.
// Example: const query = (ref) => ref.where('name', == 'david');
export type QueryFn<T = DocumentData> = (ref: CollectionReference<T>) => Query<T> | Promise<Query<T>>;

export type QueryGroupFn<T = DocumentData> = (query: Query<T>) => Query<T> | Promise<Query<T>>;

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
