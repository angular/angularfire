import { Observable, from } from 'rxjs';
import { fromCollectionRef } from '../observable/fromRef';
import { map, filter, scan } from 'rxjs/operators';
import { firestore } from 'firebase/app';

import { DocumentChangeType, CollectionReference, Query, DocumentReference, DocumentData, DocumentChangeAction } from '../interfaces';
import { docChanges, sortedChanges } from './changes';
import { AngularFirestoreDocument } from '../document/document';
import { AngularFirestore } from '../firestore';
import { runInZone } from '@angular/fire';

export function validateEventsArray(events?: DocumentChangeType[]) {
  if(!events || events!.length === 0) {
    events = ['added', 'removed', 'modified'];
  }
  return events;
}

/**
 * AngularFirestoreCollection service
 *
 * This class creates a reference to a Firestore Collection. A reference and a query are provided in
 * in the constructor. The query can be the unqueried reference if no query is desired.The class
 * is generic which gives you type safety for data update methods and data streaming.
 *
 * This class uses Symbol.observable to transform into Observable using Observable.from().
 *
 * This class is rarely used directly and should be created from the AngularFirestore service.
 *
 * Example:
 *
 * const collectionRef = firebase.firestore.collection('stocks');
 * const query = collectionRef.where('price', '>', '0.01');
 * const fakeStock = new AngularFirestoreCollection<Stock>(collectionRef, query);
 *
 * // NOTE!: the updates are performed on the reference not the query
 * await fakeStock.add({ name: 'FAKE', price: 0.01 });
 *
 * // Subscribe to changes as snapshots. This provides you data updates as well as delta updates.
 * fakeStock.valueChanges().subscribe(value => console.log(value));
 */
export class AngularFirestoreCollection<T=DocumentData> {
  /**
   * The constructor takes in a CollectionReference and Query to provide wrapper methods
   * for data operations and data streaming.
   *
   * Note: Data operation methods are done on the reference not the query. This means
   * when you update data it is not updating data to the window of your query unless
   * the data fits the criteria of the query. See the AssociatedRefence type for details
   * on this implication.
   * @param ref
   */
  constructor(
    public readonly ref: CollectionReference,
    private readonly query: Query,
    private readonly afs: AngularFirestore) { }

  /**
   * Listen to the latest change in the stream. This method returns changes
   * as they occur and they are not sorted by query order. This allows you to construct
   * your own data structure.
   * @param events
   */
  stateChanges(events?: DocumentChangeType[]): Observable<DocumentChangeAction<T>[]> {
    if(!events || events.length === 0) {
      return this.afs.scheduler.keepUnstableUntilFirst(
        this.afs.scheduler.runOutsideAngular(
          docChanges<T>(this.query)
        )
      );
    }
    return this.afs.scheduler.keepUnstableUntilFirst(
        this.afs.scheduler.runOutsideAngular(
          docChanges<T>(this.query)
        )
      )
      .pipe(
        map(actions => actions.filter(change => events.indexOf(change.type) > -1)),
        filter(changes =>  changes.length > 0)
      );
  }

  /**
   * Create a stream of changes as they occur it time. This method is similar to stateChanges()
   * but it collects each event in an array over time.
   * @param events
   */
  auditTrail(events?: DocumentChangeType[]): Observable<DocumentChangeAction<T>[]> {
    return this.stateChanges(events).pipe(scan((current, action) => [...current, ...action], []));
  }

  /**
   * Create a stream of synchronized changes. This method keeps the local array in sorted
   * query order.
   * @param events
   */
  snapshotChanges(events?: DocumentChangeType[]): Observable<DocumentChangeAction<T>[]> {
    const validatedEvents = validateEventsArray(events);
    const sortedChanges$ = sortedChanges<T>(this.query, validatedEvents);
    const scheduledSortedChanges$ = this.afs.scheduler.runOutsideAngular(sortedChanges$);
    return this.afs.scheduler.keepUnstableUntilFirst(scheduledSortedChanges$);
  }

  /**
   * Listen to all documents in the collection and its possible query as an Observable.
   */
  valueChanges(): Observable<T[]> {
    const fromCollectionRef$ = fromCollectionRef<T>(this.query);
    const scheduled$ = this.afs.scheduler.runOutsideAngular(fromCollectionRef$);
    return this.afs.scheduler.keepUnstableUntilFirst(scheduled$)
      .pipe(
        map(actions => actions.payload.docs.map(a => a.data()))
      );
  }

  /**
   * Retrieve the results of the query once. 
   * @param options 
   */
  get(options?: firestore.GetOptions) {
    return from(this.query.get(options)).pipe(
      runInZone(this.afs.scheduler.zone)
    );
  }

  /**
   * Add data to a collection reference.
   *
   * Note: Data operation methods are done on the reference not the query. This means
   * when you update data it is not updating data to the window of your query unless
   * the data fits the criteria of the query.
   */
  add(data: T): Promise<DocumentReference> {
    return this.ref.add(data);
  }

  /**
   * Create a reference to a single document in a collection.
   * @param path
   */
  doc<T>(path: string): AngularFirestoreDocument<T> {
    return new AngularFirestoreDocument<T>(this.ref.doc(path), this.afs);
  }
}
