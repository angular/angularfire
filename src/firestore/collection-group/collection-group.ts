import { Observable, from } from 'rxjs';
import { fromCollectionRef } from '../observable/fromRef';
import { map, filter, scan, observeOn } from 'rxjs/operators';
import { firestore } from 'firebase/app';

import { DocumentChangeType, Query, DocumentData, DocumentChangeAction } from '../interfaces';
import { validateEventsArray } from '../collection/collection';
import { docChanges, sortedChanges } from '../collection/changes';
import { AngularFirestore } from '../firestore';

/**
 * AngularFirestoreCollectionGroup service
 *
 * This class holds a reference to a Firestore Collection Group Query.
 *
 * This class uses Symbol.observable to transform into Observable using Observable.from().
 *
 * This class is rarely used directly and should be created from the AngularFirestore service.
 *
 * Example:
 *
 * const collectionGroup = firebase.firestore.collectionGroup('stocks');
 * const query = collectionRef.where('price', '>', '0.01');
 * const fakeStock = new AngularFirestoreCollectionGroup<Stock>(query, afs);
 *
 * // Subscribe to changes as snapshots. This provides you data updates as well as delta updates.
 * fakeStock.valueChanges().subscribe(value => console.log(value));
 */
export class AngularFirestoreCollectionGroup<T=DocumentData> {
  /**
   * The constructor takes in a CollectionGroupQuery to provide wrapper methods
   * for data operations and data streaming.
   * @param query
   * @param afs
   */
  constructor(
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
      return docChanges<T>(this.query, this.afs.schedulers.outsideAngular).pipe(
        this.afs.keepUnstableUntilFirst
      );
    }
    return docChanges<T>(this.query, this.afs.schedulers.outsideAngular)
      .pipe(
        this.afs.keepUnstableUntilFirst,
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
    const scheduledSortedChanges$ = sortedChanges<T>(this.query, validatedEvents, this.afs.schedulers.outsideAngular);
    return scheduledSortedChanges$.pipe(
      this.afs.keepUnstableUntilFirst
    );
  }

  /**
   * Listen to all documents in the collection and its possible query as an Observable.
   */
  valueChanges(): Observable<T[]> {
    const fromCollectionRefScheduled$ = fromCollectionRef<T>(this.query, this.afs.schedulers.outsideAngular);
    return fromCollectionRefScheduled$
      .pipe(
        this.afs.keepUnstableUntilFirst,
        map(actions => actions.payload.docs.map(a => a.data()))
      );
  }

  /**
   * Retrieve the results of the query once.
   * @param options
   */
  get(options?: firestore.GetOptions) {
    return from(this.query.get(options)).pipe(
      observeOn(this.afs.schedulers.insideAngular)
    );
  }

}
