import { Observable, from } from 'rxjs';
import { fromCollectionRef } from '../observable/fromRef';
import { map, filter, scan } from 'rxjs/operators';
import { firestore } from 'firebase/app';

import { DocumentChangeType, CollectionReference, Query, DocumentReference, DocumentData, DocumentChangeAction } from '../interfaces';
import { validateEventsArray } from '../collection/collection';
import { docChanges, sortedChanges } from '../collection/changes';
import { AngularFirestore } from '../firestore';
import { ɵrunInZone } from '@angular/fire';

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
      ɵrunInZone(this.afs.scheduler.zone)
    );
  }

}
