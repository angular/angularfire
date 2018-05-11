import { Subscriber } from 'rxjs';
import { DocumentChangeType, DocumentChange, CollectionReference, Query } from '@firebase/firestore-types';

export interface DocumentChangeAction {
  type: DocumentChangeType;
  payload: DocumentChange;
}

export interface Action<T> {
  type: string;
  payload: T;
};

export interface Reference<T> {
  onSnapshot: (sub: Subscriber<any>) => any;
}

// A convience type for making a query.
// Example: const query = (ref) => ref.where('name', == 'david');
export type QueryFn = (ref: CollectionReference) => Query;

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
export interface AssociatedReference {
  ref: CollectionReference;
  query: Query;
}
