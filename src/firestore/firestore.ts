import { InjectionToken, NgZone, PLATFORM_ID, Injectable, Inject, Optional } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { Settings, PersistenceSettings, CollectionReference, DocumentReference, QueryFn, Query, QueryGroupFn, AssociatedReference } from './interfaces';
import { AngularFirestoreDocument } from './document/document';
import { AngularFirestoreCollection } from './collection/collection';
import { AngularFirestoreCollectionGroup } from './collection-group/collection-group';
import { FirebaseOptions, FirebaseAppConfig, FIREBASE_OPTIONS, FIREBASE_APP_NAME, ɵfirebaseAppFactory, ɵAngularFireSchedulers, ɵkeepUnstableUntilFirstFactory } from '@angular/fire';
import { isPlatformServer } from '@angular/common';
import { firestore } from 'firebase/app';

/**
 * The value of this token determines whether or not the firestore will have persistance enabled
 */
export const ENABLE_PERSISTENCE = new InjectionToken<boolean>('angularfire2.enableFirestorePersistence');
export const PERSISTENCE_SETTINGS = new InjectionToken<PersistenceSettings|undefined>('angularfire2.firestore.persistenceSettings');
export const SETTINGS = new InjectionToken<Settings>('angularfire2.firestore.settings');

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
 * import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
 * import { Observable } from 'rxjs/Observable';
 * import { from } from 'rxjs/observable';
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
@Injectable({
  providedIn: 'any'
})
export class AngularFirestore {
  public readonly firestore: firestore.Firestore;
  public readonly persistenceEnabled$: Observable<boolean>;
  public readonly schedulers: ɵAngularFireSchedulers;
  public readonly keepUnstableUntilFirst: <T>(obs: Observable<T>) => Observable<T>;

  /**
   * Each Feature of AngularFire has a FirebaseApp injected. This way we
   * don't rely on the main Firebase App instance and we can create named
   * apps and use multiple apps.
   * @param app
   */
  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(ENABLE_PERSISTENCE) shouldEnablePersistence: boolean|null,
    @Optional() @Inject(SETTINGS) settings: Settings|null,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(PERSISTENCE_SETTINGS) persistenceSettings: PersistenceSettings|null,
  ) {
    this.schedulers = new ɵAngularFireSchedulers(zone);
    this.keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(this.schedulers, platformId);

    this.firestore = zone.runOutsideAngular(() => {
      const app = ɵfirebaseAppFactory(options, zone, nameOrConfig);
      if (!app.firestore) { throw "You must import 'firebase/firestore' before using AngularFirestore" }
      const firestore = app.firestore();
      if (settings) { firestore.settings(settings) }
      return firestore;
    });

    if (shouldEnablePersistence && !isPlatformServer(platformId)) {
      // We need to try/catch here because not all enablePersistence() failures are caught
      // https://github.com/firebase/firebase-js-sdk/issues/608
      const enablePersistence = () => {
        try {
          return from(this.firestore.enablePersistence(persistenceSettings || undefined).then(() => true, () => false));
        } catch(e) {
          return of(false);
        }
      };
      this.persistenceEnabled$ = zone.runOutsideAngular(enablePersistence);
    } else {
      this.persistenceEnabled$ = of(false);
    }
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
   * Create a reference to a Firestore Collection Group based on a collectionId
   * and an optional query function to narrow the result
   * set.
   * @param collectionId
   * @param queryGroupFn
   */
  collectionGroup<T>(collectionId: string, queryGroupFn?: QueryGroupFn): AngularFirestoreCollectionGroup<T> {
    const queryFn = queryGroupFn || (ref => ref);
    const collectionGroup: Query = this.firestore.collectionGroup(collectionId);
    return new AngularFirestoreCollectionGroup<T>(queryFn(collectionGroup), this);
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
