import { DocumentReference, SetOptions, DocumentSnapshot } from '@firebase/firestore-types';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { QueryFn, AssociatedReference, Action } from '../interfaces';
import { fromDocRef } from '../observable/fromRef';
import 'rxjs/add/operator/map';

import { Injectable } from '@angular/core';

import { AngularFirestore, associateQuery } from '../firestore';
import { AngularFirestoreCollection } from '../collection/collection';

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
export class AngularFirestoreDocument<T> {

  /**
   * The contstuctor takes in a DocumentReference to provide wrapper methods
   * for data operations, data streaming, and Symbol.observable.
   * @param ref
   */
  constructor(public ref: DocumentReference, private afs: AngularFirestore) { }

  /**
   * Create or overwrite a single document.
   * @param data
   * @param options
   */
  set(data: T, options?: SetOptions): Promise<void> {
    return this.ref.set(data, options);
  }

  /**
   * Update some fields of a document without overwriting the entire document.
   * @param data
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
   * @param path
   * @param queryFn
   */
  collection<T>(path: string, queryFn?: QueryFn): AngularFirestoreCollection<T> {
    const collectionRef = this.ref.collection(path);
    const { ref, query } = associateQuery(collectionRef, queryFn);
    return new AngularFirestoreCollection<T>(ref, query, this.afs);
  }

  /**
   * Listen to snapshot updates from the document.
   */
  snapshotChanges(): Observable<Action<DocumentSnapshot>> {
    const fromDocRef$ = fromDocRef(this.ref);
    const scheduledFromDocRef$ = this.afs.scheduler.runOutsideAngular(fromDocRef$);
    return this.afs.scheduler.keepUnstableUntilFirst(scheduledFromDocRef$);
  }

  /**
   * Listen to unwrapped snapshot updates from the document.
   */
  valueChanges(): Observable<T|null> {
    return this.snapshotChanges().map(action => {
      return action.payload.exists ? action.payload.data() as T : null;
    });
  }
}
