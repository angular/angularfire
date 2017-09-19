import * as firebase from 'firebase/app';
import 'firestore';
import { Firestore, CollectionReference, DocumentReference, Query, DocumentChangeType, SnapshotMetadata, DocumentSnapshot, QuerySnapshot, DocumentChange } from 'firestore';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import 'rxjs/add/operator/map';

import { Injectable } from '@angular/core';
import { FirebaseApp } from 'angularfire2';

// A convience type for making a query.
// Example: const query = (ref) => ref.where('name', == 'david');
export type QueryFn = (ref: CollectionReference) => Query;

/**
 * A structure that provides an association between a reference
 * and a query on that reference. Note: Performing operations
 * on the reference can lead to confusing results with complicated
 * queries.
 * 
 * Example: 
 * 
 * const query = ref.where('type', '==', 'Book').
 *                  .where('price', '>' 18.00)
 *                  .where('price', '<' 100.00)
 *                  .where('category', '==', 'Fiction')
 *                  .where('publisher', '==', 'BigPublisher')
 * 
 * // This addition would not be a result of the query above
 * ref.add({ 
 *  type: 'Magazine',
 *  price: 4.99,
 *  category: 'Sports',
 *  publisher: 'SportsPublisher'
 * });
 */
export interface AssociatedReference {
  ref: CollectionReference;
  query: Query;
}

/**
 * A utility methods for associating a collection reference with
 * a query.
 * 
 * @param collectionRef - A collection reference to query
 * @param queryFn - The callback to create a query
 * 
 * Example:
 * const { query, ref } = associateQuery(docRef.collection('items'), ref => {
 *  return ref.where('age', '<', 200);
 * });
 */
export function associateQuery(collectionRef: CollectionReference, queryFn = ref => ref): AssociatedReference {
  const query = queryFn(collectionRef);
  const ref = collectionRef;
  return { query, ref };
}

/**
 * AngularFirestore Service
 * 
 * This service is the main entry point for this feature module. It provides
 * an API for creating Collection and Reference services. These services can
 * then be used to do data updates and observable streams of the data.
 * 
 * Example:
 * 
 * import { Component } from '@angular/core';
 * import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
 * import { Observable } from 'rxjs/Observable';
 * import { from } from 'rxjs/observable/from';
 * 
 * @Component({
 *   selector: 'app-my-component',
 *   template: `
 *    <h2>Items for {{ (profile | async)?.name }}
 *    <ul>
 *       <li *ngFor="let item of items | async">{{ item.name }}</li>
 *    </ul>
 *    <div class="control-input">
 *       <input type="text" #itemname />
 *       <button (click)="addItem(itemname.value)">Add Item</button>
 *    </div>
 *   `
 * })
 * export class MyComponent implements OnInit {
 *   
 *   // services for data operations and data streaming
 *   private readonly itemsRef: AngularFirestoreCollection<Item>;
 *   private readonly profileRef: AngularFirestoreDocument<Profile>;
 * 
 *   // observables for template
 *   items: Observable<Item[]>;
 *   profile: Observable<Profile>;
 * 
 *   // inject main service
 *   constructor(private readonly afs: AngularFirestore) {}
 * 
 *   ngOnInit() {
 *     this.itemsRef = afs.collection('items', ref => ref.where('user', '==', 'davideast').limit(10));
 *     this.items = this.itemsRef.valueChanges().map(snap => snap.docs.map(data => doc.data()));
 *     // this.items = from(this.itemsRef); // you can also do this with no mapping
 *     
 *     this.profileRef = afs.doc('users/davideast');
 *     this.profile = this.profileRef.valueChanges();
 *   }
 * 
 *   addItem(name: string) {
 *     const user = 'davideast';
 *     this.itemsRef.add({ name, user });
 *   }
 * }
 */
@Injectable()
export class AngularFirestore {
  public readonly firestore: Firestore;

  /**
   * Each Feature of AngularFire has a FirebaseApp injected. This way we
   * don't rely on the main Firebase App instance and we can create named
   * apps and use multiple apps.
   * @param app 
   */
  constructor(public app: FirebaseApp) {
    this.firestore = app.firestore();
  }
  
  /**
   * Create a reference to a Firestore Collection based on a path and an optional
   * query function to narrow the result set.
   * @param path 
   * @param queryFn 
   */
  collection<T>(path: string, queryFn?: QueryFn): AngularFirestoreCollection<T> {
    const collectionRef = this.firestore.collection(path);
    const { ref, query } = associateQuery(collectionRef, queryFn);
    return new AngularFirestoreCollection<T>(ref, query);
  }

  /**
   * Create a reference to a Firestore Document based on a path. Note that documents
   * are not queryable because they are simply objects. However, documents have 
   * sub-collections that return a Collection reference and can be queried.
   * @param path 
   */
  doc<T>(path: string): AngularFirestoreDocument<T> {
    const ref = this.firestore.doc(path);
    return new AngularFirestoreDocument<T>(ref);
  }
}

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
 * const fakeStock = new AngularFirestoreDocument<Stock>(firebase.firestore.doc('stocks/FAKE'));
 * await fakeStock.set({ name: 'FAKE', price: 0.01 });
 * fakeStock.valueChanges().map(snap => { 
 *   if(snap.exists) return snap.data();
 *   return null;
 * }).subscribe(value => console.log(value));
 * // OR! Transform using Observable.from() and the data is unwrapped for you
 * Observable.from(fakeStock).subscribe(value => console.log(value));
 */
export class AngularFirestoreDocument<T> implements ArrayLike<T> {
  // TODO(davideast):  Remove these properties once TypeScript is down with Observable.from
  // These are totally useless and are used to appease TypeScript.  
  public length: number;
  [n: number]: T;

  /**
   * The contstuctor takes in a DocumentReference to provide wrapper methods
   * for data operations, data streaming, and Symbol.observable.
   * @param ref 
   */
  constructor(public ref: DocumentReference) {}

  /**
   * Create or overwrite a single document.
   * @param data
   */
  set(data: T): Promise<void> {
    return this.ref.set(data);
  }

  /**
   * Update some fields of a document without overwriting the entire document.
   * @param data 
   */
  update(data: T): Promise<void> {
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
    const {ref, query} = associateQuery(collectionRef, queryFn);
    return new AngularFirestoreCollection<T>(ref, query);
  }

  /**
   * Listen to snapshot updates from the document.
   */
  snapshotChanges(): Observable<DocumentSnapshot> {
    return new Observable<DocumentSnapshot>(subscriber => {
      const unsubscribe = this.ref.onSnapshot(subscriber);
      return { unsubscribe };
    });
  }

  /**
   * Listen to unwrapped snapshot updates from the document.
   */  
  valueChanges(): Observable<T> {
    return this.snapshotChanges().map(snap => {
      return (snap.exists ? snap.data() : null) as T;
    });
  }
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
  snapshotChanges(): Observable<QuerySnapshot> {
    return new Observable<QuerySnapshot>(subscriber => {
      const unsubscribe = this.query.onSnapshot(subscriber);
      return { unsubscribe };
    });
  }

  /**
   * Listen to all documents in the collection and its possible query as an Observable.
   * This method returns a stream of unwrapped snapshots.
   */  
  valueChanges(): Observable<T[]> {
    return this.snapshotChanges()
      .map(snap => snap.docs.map(doc => doc.data()) as T[]);
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
