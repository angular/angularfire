import { Observable } from 'rxjs';
import { Action, DocumentSnapshot, QueryFn, GetOptions } from '../interfaces';
import { fromDocRef } from '../observable/fromRef';
import { map, observeOn, switchMap } from 'rxjs/operators';
import { AngularFirestore, associateQuery } from '../firestore';
import { AngularFirestoreCollection } from '../collection/collection';
import { DocumentData, DocumentReference, SetOptions, CollectionReference } from 'firebase/firestore';

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
  async set(data: T, options?: SetOptions) {
    const ref = await this.ref.toPromise();
    const { setDoc } = await import(/* webpackExports: ["setDoc"] */ 'firebase/firestore');
    return await setDoc(ref, data, options);
  }

  /**
   * Update some fields of a document without overwriting the entire document.
   */
  async update(data: Partial<T>) {
    const ref = await this.ref.toPromise();
    const { updateDoc } = await import(/* webpackExports: ["updateDoc"] */ 'firebase/firestore');
    return await updateDoc(ref, data);
  }

  /**
   * Delete a document.
   */
  async delete() {
    const ref = await this.ref.toPromise();
    const { deleteDoc } = await import(/* webpackExports: ["deleteDoc"] */ 'firebase/firestore');
    return await deleteDoc(ref);
  }

  /**
   * Create a reference to a sub-collection given a path and an optional query
   * function.
   */
  collection<R = DocumentData>(path: string, queryFn?: QueryFn): AngularFirestoreCollection<R> {
    const promise = this.ref.pipe(
      switchMap(async ref => {
        const { collection } = await import(/* webpackExports: ["collection"] */ 'firebase/firestore');
        const collectionRef = collection(ref, path) as CollectionReference<R>;
        return await associateQuery(collectionRef, queryFn);
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
  get(options?: GetOptions) {
    return this.ref.pipe(
      switchMap(async ref => {
        if (options?.source === 'server') {
          const { getDocFromServer } = await import(/* webpackExports: ["getDocFromServer"] */ 'firebase/firestore');
          return await getDocFromServer(ref);
        } else if (options?.source === 'cache') {
          const { getDocFromCache } = await import(/* webpackExports: ["getDocFromCache"] */ 'firebase/firestore');
          return await getDocFromCache(ref);
        } else {
          const { getDoc } = await import(/* webpackExports: ["getDoc"] */ 'firebase/firestore');
          return await getDoc(ref);
        }
      }),
      observeOn(this.afs.schedulers.insideAngular),
    );
  }
}
