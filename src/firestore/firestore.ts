import * as firebase from 'firebase/app';
import * as firestore from 'firestore';
import 'firestore';
import { Firestore, CollectionReference, Query } from 'firestore';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Operator } from 'rxjs/Operator';
import { Subscriber } from 'rxjs/Subscriber';
import { Subscription } from 'rxjs/Subscription';

import { Injectable } from '@angular/core';
import { FirebaseApp } from 'angularfire2';

@Injectable()
export class AngularFirestore {
  firestore: Firestore;

  constructor(public app: FirebaseApp) {
    this.firestore = app.firestore();
  }
  
  collection(path: string, queryFn: (ref: CollectionReference) => Query = ref => ref): Observable<firestore.QuerySnapshot> {
    const ref = this.firestore.collection(path);
    const query = queryFn(ref);    
    return new Observable(subscriber => {
      const unsubscribe = query.onSnapshot(subscriber);
      return new Subscription(unsubscribe);
    });
  }

  doc(path: string): Observable<firestore.DocumentSnapshot> {
    const ref = this.firestore.doc(path);
    return new Observable(subscriber => {
      const unsubscribe = ref.onSnapshot(subscriber);
      return new Subscription(unsubscribe);
    });
  }

}

export class FirestoreDocumentReferenceObservable<T> extends Observable<T> {
  constructor(public originalRef: firestore.DocumentReference, subscribe?: <R>(subscriber: Subscriber<R>) => Subscription) {
    super(subscribe);
  }
  
  lift<T, R>(operator: Operator<T, R>): Observable<R> {
    const observable = new FirestoreDocumentReferenceObservable<R>(this.originalRef);
    observable.source = this;
    observable.operator = operator;
    observable.originalRef = this.originalRef;
    return observable;
  }
}

export class FirestoreCollectionReferenceObservable<T> extends Observable<T> {
  constructor(public originalRef: firestore.CollectionReference, public query: firestore.Query, subscribe?: <R>(subscriber: Subscriber<R>) => Subscription) {
    super(subscribe);
  }
  
  lift<T, R>(operator: Operator<T, R>): Observable<R> {
    const observable = new FirestoreCollectionReferenceObservable<R>(this.originalRef, this.query);
    observable.source = this;
    observable.operator = operator;
    observable.query = this.query;
    observable.originalRef = this.originalRef;
    return observable;
  }
}

/**
 *   collection(path: string, queryFn: (ref: CollectionReference) => Query = ref => ref): Observable<firestore.QuerySnapshot> {
    const ref = this.firestore.collection(path);
    const query = queryFn(ref);    
    return new FirestoreCollectionReferenceObservable(ref, query, subscriber => {
      const unsubscribe = query.onSnapshot(subscriber.next, subscriber.error, subscriber.complete);
      return new Subscription(unsubscribe);
    });
  }

  doc(path: string): Observable<firestore.DocumentSnapshot> {
    const ref = this.firestore.doc(path);
    return new FirestoreDocumentReferenceObservable(ref, subscriber => {
      const unsubscribe = ref.onSnapshot(subscriber.next, subscriber.error, subscriber.complete);
      return new Subscription(unsubscribe);
    });
  }
 */