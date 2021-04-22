import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import {
  AssociatedReference,
  CollectionReference,
  DocumentReference,
  PersistenceSettings,
  Query,
  QueryFn,
  QueryGroupFn,
  Settings
} from './interfaces';
import { AngularFirestoreDocument } from './document/document';
import { AngularFirestoreCollection } from './collection/collection';
import { AngularFirestoreCollectionGroup } from './collection-group/collection-group';
import {
  FIREBASE_APP_NAME,
  FIREBASE_OPTIONS,
  ɵAngularFireSchedulers,
  ɵfirebaseAppFactory,
  ɵkeepUnstableUntilFirstFactory,
  FirebaseApp
} from '@angular/fire';
import { FirebaseOptions } from 'firebase/app';
import { isPlatformServer } from '@angular/common';
import { FirebaseFirestore, useFirestoreEmulator, enableIndexedDbPersistence, collection, collectionGroup, doc, initializeFirestore } from 'firebase/firestore';
import { ɵfetchInstance } from '@angular/fire';

/**
 * The value of this token determines whether or not the firestore will have persistance enabled
 */
export const ENABLE_PERSISTENCE = new InjectionToken<boolean>('angularfire2.enableFirestorePersistence');
export const PERSISTENCE_SETTINGS = new InjectionToken<PersistenceSettings | undefined>('angularfire2.firestore.persistenceSettings');
export const SETTINGS = new InjectionToken<Settings>('angularfire2.firestore.settings');

// SEMVER(7): use Parameters to determine the useEmulator arguments
// type UseEmulatorArguments = Parameters<typeof Firestore.prototype.useEmulator>;
type UseEmulatorArguments = [string, number];
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.firestore.use-emulator');

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
export function associateQuery<T>(collectionRef: CollectionReference<T>, queryFn = ref => ref): AssociatedReference<T> {
  const query = queryFn(collectionRef);
  const ref = collectionRef;
  return { query, ref };
}

type InstanceCache = Map<FirebaseApp, [
  FirebaseFirestore,
  Settings | null,
  UseEmulatorArguments | null,
  boolean | null]
>;

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
  public readonly firestore: FirebaseFirestore;
  public readonly persistenceEnabled$: Observable<boolean>;
  public readonly schedulers: ɵAngularFireSchedulers;
  public readonly keepUnstableUntilFirst: <T>(obs: Observable<T>) => Observable<T>;

  /**
   * Each Feature of AngularFire has a FirebaseApp injected. This way we
   * don't rely on the main Firebase App instance and we can create named
   * apps and use multiple apps.
   */
  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) name: string | null | undefined,
    @Optional() @Inject(ENABLE_PERSISTENCE) shouldEnablePersistence: boolean | null,
    @Optional() @Inject(SETTINGS) settings: Settings | null,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(PERSISTENCE_SETTINGS) persistenceSettings: PersistenceSettings | null,
    @Optional() @Inject(USE_EMULATOR) _useEmulator: any,
  ) {
    this.schedulers = new ɵAngularFireSchedulers(zone);
    this.keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(this.schedulers);

    const app = ɵfirebaseAppFactory(options, zone, name);
    // if (!firebase.auth && useAuthEmulator) {
    //   ɵlogAuthEmulatorError();
    // }
    const useEmulator: UseEmulatorArguments | null = _useEmulator;

    [this.firestore, this.persistenceEnabled$] = ɵfetchInstance(`${app.name}.firestore`, 'AngularFirestore', app.name, () => {
      const firestore = zone.runOutsideAngular(() => initializeFirestore(app, settings));

      if (useEmulator) {
        const [host, port] = useEmulator;
        useFirestoreEmulator(firestore, host, port);
      }

      if (shouldEnablePersistence && !isPlatformServer(platformId)) {
        // We need to try/catch here because not all enablePersistence() failures are caught
        // https://github.com/firebase/firebase-js-sdk/issues/608
        const enablePersistence = () => {
          try {
            return from(enableIndexedDbPersistence(firestore, persistenceSettings || undefined).then(() => true, () => false));
          } catch (e) {
            if (typeof console !== 'undefined') { console.warn(e); }
            return of(false);
          }
        };
        return [firestore, zone.runOutsideAngular(enablePersistence)];
      } else {
        return [firestore, of(false)];
      }

    }, [settings, useEmulator, shouldEnablePersistence]);
  }

  /**
   * Create a reference to a Firestore Collection based on a path or
   * CollectionReference and an optional query function to narrow the result
   * set.
   */
  collection<T>(path: string, queryFn?: QueryFn): AngularFirestoreCollection<T>;
  // tslint:disable-next-line:unified-signatures
  collection<T>(ref: CollectionReference, queryFn?: QueryFn): AngularFirestoreCollection<T>;
  collection<T>(pathOrRef: string | CollectionReference<T>, queryFn?: QueryFn): AngularFirestoreCollection<T> {
    let collectionRef: CollectionReference<T>;
    if (typeof pathOrRef === 'string') {
      collectionRef = collection(this.firestore, pathOrRef) as CollectionReference<T>;
    } else {
      collectionRef = pathOrRef;
    }
    const { ref, query } = associateQuery<T>(collectionRef, queryFn);
    const refInZone = this.schedulers.ngZone.run(() => ref);
    return new AngularFirestoreCollection<T>(refInZone, query, this);
  }

  /**
   * Create a reference to a Firestore Collection Group based on a collectionId
   * and an optional query function to narrow the result
   * set.
   */
  collectionGroup<T>(collectionId: string, queryGroupFn?: QueryGroupFn<T>): AngularFirestoreCollectionGroup<T> {
    const queryFn = queryGroupFn || (ref => ref);
    const colGroup: Query<T> = collectionGroup(this.firestore, collectionId) as Query<T>;
    return new AngularFirestoreCollectionGroup<T>(queryFn(colGroup), this);
  }

  /**
   * Create a reference to a Firestore Document based on a path or
   * DocumentReference. Note that documents are not queryable because they are
   * simply objects. However, documents have sub-collections that return a
   * Collection reference and can be queried.
   */
  doc<T>(path: string): AngularFirestoreDocument<T>;
  // tslint:disable-next-line:unified-signatures
  doc<T>(ref: DocumentReference): AngularFirestoreDocument<T>;
  doc<T>(pathOrRef: string | DocumentReference<T>): AngularFirestoreDocument<T> {
    let ref: DocumentReference<T>;
    if (typeof pathOrRef === 'string') {
      ref = doc(this.firestore, pathOrRef) as DocumentReference<T>;
    } else {
      ref = pathOrRef;
    }
    const refInZone = this.schedulers.ngZone.run(() => ref);
    return new AngularFirestoreDocument<T>(refInZone, this);
  }

  /**
   * Returns a generated Firestore Document Id.
   */
  createId() {
    const col = collection(this.firestore, '_');
    return doc(col).id;
  }
}
