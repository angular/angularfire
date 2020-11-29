import { Observable } from 'rxjs';
import { fromCollectionRef } from '../observable/fromRef';
import { filter, map, observeOn, scan, switchMap } from 'rxjs/operators';
import firebase from 'firebase/app';
import { CollectionReference, DocumentChangeAction, DocumentChangeType, DocumentData, DocumentReference, Query } from '../interfaces';
import { docChanges, sortedChanges } from './changes';
import { AngularFirestoreDocument } from '../document/document';
import { AngularFirestore } from '../firestore';

export function validateEventsArray(events?: DocumentChangeType[]) {
  if (!events || events.length === 0) {
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
export class AngularFirestoreCollection<T = DocumentData> {
  /**
   * The constructor takes in a CollectionReference and Query to provide wrapper methods
   * for data operations and data streaming.
   *
   * Note: Data operation methods are done on the reference not the query. This means
   * when you update data it is not updating data to the window of your query unless
   * the data fits the criteria of the query. See the AssociatedRefence type for details
   * on this implication.
   */
  constructor(
    public readonly ref: Observable<CollectionReference<T>>,
    private readonly query: Observable<Query<T>>,
    private readonly afs: AngularFirestore) { }

  /**
   * Listen to the latest change in the stream. This method returns changes
   * as they occur and they are not sorted by query order. This allows you to construct
   * your own data structure.
   */
  stateChanges(events?: DocumentChangeType[]): Observable<DocumentChangeAction<T>[]> {
    if (!events || events.length === 0) {
      this.query.pipe(
        switchMap(query => docChanges<T>(query, this.afs.schedulers.outsideAngular)),
        filter(changes =>  changes.length > 0),
        this.afs.keepUnstableUntilFirst
      );
    }
    return this.query.pipe(
      switchMap(query => docChanges<T>(query, this.afs.schedulers.outsideAngular)),
      map(actions => actions.filter(change => events.indexOf(change.type) > -1)),
      filter(changes =>  changes.length > 0),
      this.afs.keepUnstableUntilFirst
    );
  }

  /**
   * Create a stream of changes as they occur it time. This method is similar to stateChanges()
   * but it collects each event in an array over time.
   */
  auditTrail(events?: DocumentChangeType[]): Observable<DocumentChangeAction<T>[]> {
    return this.stateChanges(events).pipe(scan((current, action) => [...current, ...action], []));
  }

  /**
   * Create a stream of synchronized changes. This method keeps the local array in sorted
   * query order.
   */
  snapshotChanges(events?: DocumentChangeType[]): Observable<DocumentChangeAction<T>[]> {
    const validatedEvents = validateEventsArray(events);
    return this.query.pipe(
      switchMap(query => sortedChanges<T>(query, validatedEvents, this.afs.schedulers.outsideAngular)),
      this.afs.keepUnstableUntilFirst
    );
  }

  /**
   * Listen to all documents in the collection and its possible query as an Observable.
   *
   * If the `idField` option is provided, document IDs are included and mapped to the
   * provided `idField` property name.
   */
  valueChanges(): Observable<T[]>;
  // tslint:disable-next-line:unified-signatures
  valueChanges({}): Observable<T[]>;
  valueChanges<K extends string>(options: {idField: K}): Observable<(T & { [T in K]: string })[]>;
  valueChanges<K extends string>(options: {idField?: K} = {}): Observable<T[]> {
    return this.query.pipe(
      switchMap(query => fromCollectionRef<T>(query, this.afs.schedulers.outsideAngular)),
      map(actions => actions.payload.docs.map(a => {
        if (options.idField) {
          return {
            ...a.data() as {},
            ...{ [options.idField]: a.id }
          } as T & { [T in K]: string };
        } else {
          return a.data();
        }
      })),
      this.afs.keepUnstableUntilFirst
    );
  }

  /**
   * Retrieve the results of the query once.
   */
  get(options?: firebase.firestore.GetOptions) {
    return this.query.pipe(
      switchMap(query => query.get(options)),
      observeOn(this.afs.schedulers.insideAngular),
    );
  }

  /**
   * Add data to a collection reference.
   *
   * Note: Data operation methods are done on the reference not the query. This means
   * when you update data it is not updating data to the window of your query unless
   * the data fits the criteria of the query.
   */
  add(data: T): Promise<DocumentReference<T>> {
    return this.ref.toPromise().then(ref => ref.add(data));
  }

  /**
   * Create a reference to a single document in a collection.
   */
  doc<T2 = T>(path?: string): AngularFirestoreDocument<T2> {
    // TODO is there a better way to solve this type issue
    return new AngularFirestoreDocument(this.ref.pipe(map(ref => ref.doc(path) as any)), this.afs);
  }
}
