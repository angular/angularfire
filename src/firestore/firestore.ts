import { InjectionToken, NgZone, PLATFORM_ID, Injectable, Inject, Optional } from '@angular/core';

import { Observable, of, from } from 'rxjs';

import { Settings, PersistenceSettings, CollectionReference, DocumentReference, QueryFn, Query, QueryGroupFn, AssociatedReference } from './interfaces';
import { AngularFirestoreDocument } from './document/document';
import { AngularFirestoreCollection } from './collection/collection';
import { AngularFirestoreCollectionGroup } from './collection-group/collection-group';

import { FirebaseFirestore, FirebaseOptions, FirebaseAppConfig, FirebaseOptionsToken, FirebaseNameOrConfigToken, _firebaseAppFactory, AngularFireSchedulers, keepUnstableUntilFirstFactory } from '@angular/fire';
import { isPlatformServer } from '@angular/common';

// Workaround for Nodejs build
// @ts-ignore
import firebase from 'firebase/app';

// SEMVER: have to import here while we target ng 6, as the version of typescript doesn't allow dynamic import of types
import { firestore } from 'firebase/app';

/**
 * The value of this token determines whether or not the firestore will have persistance enabled
 */
export const EnablePersistenceToken = new InjectionToken<boolean>('angularfire2.enableFirestorePersistence');
export const PersistenceSettingsToken = new InjectionToken<PersistenceSettings|undefined>('angularfire2.firestore.persistenceSettings');
export const FirestoreSettingsToken = new InjectionToken<Settings>('angularfire2.firestore.settings');

// timestampsInSnapshots was depreciated in 5.8.0
const major = parseInt(firebase.SDK_VERSION.split('.')[0]);
const minor = parseInt(firebase.SDK_VERSION.split('.')[1]);
export const DefaultFirestoreSettings = ((major < 5 || (major == 5 && minor < 8)) ? {timestampsInSnapshots: true} : {}) as Settings;

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
  public readonly schedulers: AngularFireSchedulers;
  public readonly keepUnstableUntilFirst: <T>(obs: Observable<T>) => Observable<T>;

  /**
   * Each Feature of AngularFire has a FirebaseApp injected. This way we
   * don't rely on the main Firebase App instance and we can create named
   * apps and use multiple apps.
   * @param app
   */
  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseNameOrConfigToken) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(EnablePersistenceToken) shouldEnablePersistence: boolean|null,
    @Optional() @Inject(FirestoreSettingsToken) settings: Settings|null,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(PersistenceSettingsToken) persistenceSettings: PersistenceSettings|null,
  ) {
    this.schedulers = new AngularFireSchedulers(zone);
    this.keepUnstableUntilFirst = keepUnstableUntilFirstFactory(this.schedulers, platformId);

    this.firestore = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, zone, nameOrConfig);
      const firestore = app.firestore();
      firestore.settings(settings || DefaultFirestoreSettings);
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
    if (major < 6) { throw "collection group queries require Firebase JS SDK >= 6.0"}
    const queryFn = queryGroupFn || (ref => ref);
    const firestore: any = this.firestore; // SEMVER: ditch any once targeting >= 6.0
    const collectionGroup: Query = firestore.collectionGroup(collectionId);
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
