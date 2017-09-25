import * as firebase from 'firebase/app';
import 'firestore';
import { Firestore, CollectionReference, DocumentReference, Query, DocumentChangeType, SnapshotMetadata, DocumentSnapshot, QuerySnapshot, DocumentChange } from 'firestore';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { fromCollectionRef } from '../observable/fromRef';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/observable/do';


import { Injectable } from '@angular/core';
import { FirebaseApp } from 'angularfire2';

import { QueryFn, AssociatedReference, DocumentChangeAction } from '../interfaces';
import { docChanges, sortedChanges } from './changes';
import { AngularFirestoreDocument } from '../document/document';

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
 * fakeStock.valueChanges().map(snap => snap.docs.map(doc => doc.data()).subscribe(value => console.log(value));
 * // OR! Avoid unwrapping and transform from an Observable
 * Observable.from(fakeStock).subscribe(value => console.log(value));
 */
export class AngularFirestoreCollection<T> {
  /**
   * The contstuctor takes in a CollectionReference and Query to provide wrapper methods
   * for data operations, data streaming, and Symbol.observable.
   * 
   * Note: Data operation methods are done on the reference not the query. This means
   * when you update data it is not updating data to the window of your query unless
   * the data fits the criteria of the query. See the AssociatedRefence type for details 
   * on this implication.
   * @param ref 
   */  
  constructor(
    public readonly ref: CollectionReference,
    private readonly query: Query) { }

  /**
   * Listen to all documents in the collection and its possible query as an Observable.
   * This method returns a stream of DocumentSnapshots which gives the ability to get
   * the data set back as array and/or the delta updates in the collection.
   */
  stateChanges(events?: DocumentChangeType[]): Observable<DocumentChangeAction[]> {
    if(!events || events.length === 0) {
      return docChanges(this.query);
    }
    return docChanges(this.query)
      .map(actions => actions.filter(change => events.indexOf(change.type) > -1))
      .filter(changes =>  changes.length > 0);
  }

  auditTrail(events?: DocumentChangeType[]): Observable<DocumentChangeAction[]> {
    return this.stateChanges(events).scan((current, action) => [...current, ...action], []);
  }
  
  snapshotChanges(events?: DocumentChangeType[]): Observable<DocumentChangeAction[]> {
    events = validateEventsArray(events);
    return sortedChanges(this.query, events);
  }
  
  /**
   * Listen to all documents in the collection and its possible query as an Observable.
   * This method returns a stream of unwrapped snapshots.
   */  
  valueChanges(events?: DocumentChangeType[]): Observable<T[]> {
    return this.stateChanges()
      .map(actions => actions.map(a => a.payload.doc.data()) as T[]);
  }

  /**
   * Add data to a collection reference.
   * 
   * Note: Data operation methods are done on the reference not the query. This means
   * when you update data it is not updating data to the window of your query unless
   * the data fits the criteria of the query.
   */
  add(data: T) {
    return this.ref.add(data);
  }

  /**
   * Create a reference to a single document in a collection.
   * @param path 
   */
  doc(path: string) {
    return new AngularFirestoreDocument(this.ref.doc(path));
  }
}
