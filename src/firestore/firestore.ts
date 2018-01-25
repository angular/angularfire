import { FirebaseFirestore, CollectionReference } from '@firebase/firestore-types';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { from } from 'rxjs/observable/from';
import 'rxjs/add/operator/map';

import { Injectable, Inject, Optional } from '@angular/core';
import { FirebaseApp } from 'angularfire2';

import { QueryFn, AssociatedReference } from './interfaces';
import { AngularFirestoreDocument } from './document/document';
import { AngularFirestoreCollection } from './collection/collection';
import { EnablePersistenceToken } from './enable-persistance-token';


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
  public readonly firestore: FirebaseFirestore;
  public readonly persistenceEnabled$: Observable<boolean>;

  /**
   * Each Feature of AngularFire has a FirebaseApp injected. This way we
   * don't rely on the main Firebase App instance and we can create named
   * apps and use multiple apps.
   * @param app
   */
  constructor(public app: FirebaseApp, @Optional() @Inject(EnablePersistenceToken) shouldEnablePersistence: boolean) {
    this.firestore = app.firestore();

    this.persistenceEnabled$ = shouldEnablePersistence ?
      from(app.firestore().enablePersistence().then(() => true, () => false)) :
      from(new Promise((res, rej) => { res(false); }));
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

  /**
   * Returns a generated Firestore Document Id.
   */
  createId() {
    return this.firestore.collection('_').doc().id
  }
}
