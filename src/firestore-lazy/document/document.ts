import { from, Observable } from 'rxjs';
import { Action, DocumentData, DocumentReference, DocumentSnapshot, QueryFn, SetOptions } from '../interfaces';
import { fromDocRef } from '../observable/fromRef';
import { map, observeOn, switchMap } from 'rxjs/operators';
import { AngularFirestore, associateQuery } from '../firestore';
import { AngularFirestoreCollection } from '../collection/collection';
import firebase from 'firebase/app';

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
  constructor(public ref: Observable<DocumentReference<T>>, private afs: AngularFirestore) { }

  /**
   * Create or overwrite a single document.
   */
  set(data: T, options?: SetOptions): Promise<void> {
    return this.ref.toPromise().then(ref => ref.set(data, options));
  }

  /**
   * Update some fields of a document without overwriting the entire document.
   */
  update(data: Partial<T>): Promise<void> {
    return this.ref.toPromise().then(ref => ref.update(data));
  }

  /**
   * Delete a document.
   */
  delete(): Promise<void> {
    return this.ref.toPromise().then(ref => ref.delete());
  }

  /**
   * Create a reference to a sub-collection given a path and an optional query
   * function.
   */
  collection<R = DocumentData>(path: string, queryFn?: QueryFn): AngularFirestoreCollection<R> {
    const promise = this.ref.pipe(
      map(ref => {
        const collectionRef = ref.collection(path) as firebase.firestore.CollectionReference<R>;
        return associateQuery(collectionRef, queryFn);
      }
    ));
    const ref = promise.pipe(map(it => it.ref));
    const query = promise.pipe(map(it => it.query));
    return new AngularFirestoreCollection(ref, query, this.afs);
  }

  /**
   * Listen to snapshot updates from the document.
   */
  snapshotChanges(): Observable<Action<DocumentSnapshot<T>>> {
    return this.ref.pipe(
      switchMap(ref => fromDocRef<T>(ref, this.afs.schedulers.outsideAngular)),
      this.afs.keepUnstableUntilFirst
    );
  }

  /**
   * Listen to unwrapped snapshot updates from the document.
   *
   * If the `idField` option is provided, document IDs are included and mapped to the
   * provided `idField` property name.
   */
  valueChanges(options?: { }): Observable<T | undefined>;
  valueChanges<K extends string>(options: { idField: K }): Observable<(T & { [T in K]: string }) | undefined>;
  valueChanges<K extends string>(options: { idField?: K } = {}): Observable<T | undefined> {
    return this.snapshotChanges().pipe(
      map(({ payload }) =>
        options.idField ? {
          ...payload.data(),
          ...{ [options.idField]: payload.id }
        } as T & { [T in K]: string } : payload.data()
      )
    );
  }

  /**
   * Retrieve the document once.
   */
  get(options?: firebase.firestore.GetOptions) {
    return this.ref.pipe(
      switchMap(ref => ref.get(options)),
      observeOn(this.afs.schedulers.insideAngular),
    );
  }
}
