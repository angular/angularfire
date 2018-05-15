import { InjectionToken, NgZone, PLATFORM_ID, Injectable, Inject, Optional } from '@angular/core';
import { FirebaseFirestore, CollectionReference, DocumentReference, Settings } from '@firebase/firestore-types';

import { Observable, Subscriber, of, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FirebaseOptions, FirebaseAppConfig } from '@firebase/app-types';

import { QueryFn, AssociatedReference } from './interfaces';
import { AngularFirestoreDocument } from './document/document';
import { AngularFirestoreCollection } from './collection/collection';

import { FirebaseOptionsToken, FirebaseNameOrConfigToken, _firebaseAppFactory, FirebaseZoneScheduler } from 'angularfire2';

/**
 * The value of this token determines whether or not the firestore will have persistance enabled
 */
export const EnablePersistenceToken = new InjectionToken<boolean>('angularfire2.enableFirestorePersistence');
export const FirestoreSettingsToken = new InjectionToken<Settings>('angularfire2.firestore.settings');

export const DefaultFirestoreSettings = {timestampsInSnapshots: true} as Settings;

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
  public readonly scheduler: FirebaseZoneScheduler;

  /**
   * Each Feature of AngularFire has a FirebaseApp injected. This way we
   * don't rely on the main Firebase App instance and we can create named
   * apps and use multiple apps.
   * @param app
   */
  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseNameOrConfigToken) nameOrConfig:string|FirebaseAppConfig|undefined,
    @Optional() @Inject(EnablePersistenceToken) shouldEnablePersistence: boolean,
    @Optional() @Inject(FirestoreSettingsToken) settings: Settings,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    this.scheduler = new FirebaseZoneScheduler(zone, platformId);
    this.firestore = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, nameOrConfig);
      const firestore = app.firestore();
      firestore.settings(settings || DefaultFirestoreSettings);
      return firestore;
    });

    this.persistenceEnabled$ = zone.runOutsideAngular(() =>
        shouldEnablePersistence ? from(this.firestore.enablePersistence().then(() => true, () => false))
                                : of(false)
      )
      .pipe(
        catchError(() => of(false))
      ); // https://github.com/firebase/firebase-js-sdk/issues/608
  }

  /**
   * Create a reference to a Firestore Collection based on a path or
   * CollectionReference and an optional query function to narrow the result
   * set.
   * @param pathOrRef
   * @param queryFn
   */
  collection<T>(path: string, queryFn?: QueryFn): AngularFirestoreCollection<T>
  collection<T>(ref: CollectionReference, queryFn?: QueryFn): AngularFirestoreCollection<T>
  collection<T>(pathOrRef: string | CollectionReference, queryFn?: QueryFn): AngularFirestoreCollection<T> {
    let collectionRef: CollectionReference;
    if (typeof pathOrRef === 'string') {
      collectionRef = this.firestore.collection(pathOrRef);
    } else {
      collectionRef = pathOrRef;
    }
    const { ref, query } = associateQuery(collectionRef, queryFn);
    return new AngularFirestoreCollection<T>(ref, query, this);
  }

  /**
   * Create a reference to a Firestore Document based on a path or
   * DocumentReference. Note that documents are not queryable because they are
   * simply objects. However, documents have sub-collections that return a
   * Collection reference and can be queried.
   * @param pathOrRef
   */
  doc<T>(path: string): AngularFirestoreDocument<T>
  doc<T>(ref: DocumentReference): AngularFirestoreDocument<T>
  doc<T>(pathOrRef: string | DocumentReference): AngularFirestoreDocument<T> {
    let ref: DocumentReference;
    if (typeof pathOrRef === 'string') {
      ref = this.firestore.doc(pathOrRef);
    } else {
      ref = pathOrRef;
    }
    return new AngularFirestoreDocument<T>(ref, this);
  }

  /**
   * Returns a generated Firestore Document Id.
   */
  createId() {
    return this.firestore.collection('_').doc().id
  }
}
