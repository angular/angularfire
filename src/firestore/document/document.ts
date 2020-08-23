import { from, Observable } from 'rxjs';
import { Action, DocumentData, DocumentReference, DocumentSnapshot, QueryFn, SetOptions } from '../interfaces';
import { fromDocRef } from '../observable/fromRef';
import { map, observeOn } from 'rxjs/operators';
import { AngularFirestore, associateQuery } from '../firestore';
import { AngularFirestoreCollection } from '../collection/collection';
import { firestore } from 'firebase/app';

/**
 * AngularFirestoreDocument service
 *
 * This class creates a reference to a Firestore Document. A reference is provided in
 * in the constructor. The class is generic which gives you type safety for data update
 * methods and data streaming.
 *
 * This class uses Symbol.observable to transform into Observable using Observable.from().
 *
 * This class is rarely used directly and should be created from the AngularFirestore service.
 *
 * Example:
 *
 * const fakeStock = new AngularFirestoreDocument<Stock>(doc('stocks/FAKE'));
 * await fakeStock.set({ name: 'FAKE', price: 0.01 });
 * fakeStock.valueChanges().map(snap => {
 *   if(snap.exists) return snap.data();
 *   return null;
 * }).subscribe(value => console.log(value));
 * // OR! Transform using Observable.from() and the data is unwrapped for you
 * Observable.from(fakeStock).subscribe(value => console.log(value));
 */
export class AngularFirestoreDocument<T = DocumentData> {

  /**
   * The constructor takes in a DocumentReference to provide wrapper methods
   * for data operations, data streaming, and Symbol.observable.
   */
  constructor(public ref: DocumentReference<T>, private afs: AngularFirestore) { }

  /**
   * Create or overwrite a single document.
   */
  set(data: T, options?: SetOptions): Promise<void> {
    return this.ref.set(data, options);
  }

  /**
   * Update some fields of a document without overwriting the entire document.
   */
  update(data: Partial<T>): Promise<void> {
    return this.ref.update(data);
  }

  /**
   * Delete a document.
   */
  delete(): Promise<void> {
    return this.ref.delete();
  }

  /**
   * Create a reference to a sub-collection given a path and an optional query
   * function.
   */
  collection(path: string, queryFn?: QueryFn<T>): AngularFirestoreCollection<T> {
    const collectionRef = this.ref.collection(path) as firestore.CollectionReference<T>;
    const { ref, query } = associateQuery<T>(collectionRef, queryFn);
    return new AngularFirestoreCollection<T>(ref, query, this.afs);
  }

  /**
   * Listen to snapshot updates from the document.
   */
  snapshotChanges(): Observable<Action<DocumentSnapshot<T>>> {
    const scheduledFromDocRef$ = fromDocRef<T>(this.ref, this.afs.schedulers.outsideAngular);
    return scheduledFromDocRef$.pipe(
      this.afs.keepUnstableUntilFirst
    );
  }

  /**
   * Listen to unwrapped snapshot updates from the document.
   */
  valueChanges(): Observable<T|undefined> {
    return this.snapshotChanges().pipe(
      map(action => {
        return action.payload.data();
      })
    );
  }

  /**
   * Retrieve the document once.
   */
  get(options?: firestore.GetOptions) {
    return from(this.ref.get(options)).pipe(
      observeOn(this.afs.schedulers.insideAngular),
    );
  }
}
