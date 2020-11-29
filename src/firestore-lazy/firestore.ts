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
  FirebaseAppConfig,
  FirebaseOptions,
  ɵAngularFireSchedulers,
  ɵfirebaseAppFactory,
  ɵkeepUnstableUntilFirstFactory,
  ɵlazySDKProxy,
  ɵPromiseProxy,
  ɵapplyMixins,
} from '@angular/fire';
import { isPlatformServer } from '@angular/common';
import firebase from 'firebase/app';
import { ɵfetchInstance } from '@angular/fire';
import { map, observeOn, shareReplay, switchMap } from 'rxjs/operators';
import { newId } from './util';
import { proxyPolyfillCompat } from './base';

/**
 * The value of this token determines whether or not the firestore will have persistance enabled
 */
export const ENABLE_PERSISTENCE = new InjectionToken<boolean>('angularfire2.enableFirestorePersistence');
export const PERSISTENCE_SETTINGS = new InjectionToken<PersistenceSettings | undefined>('angularfire2.firestore.persistenceSettings');
export const SETTINGS = new InjectionToken<Settings>('angularfire2.firestore.settings');

// SEMVER(7): use Parameters to detirmine the useEmulator arguments
// type UseEmulatorArguments = Parameters<typeof firebase.firestore.Firestore.prototype.useEmulator>;
export type ɵUseEmulatorArguments = [string, number];
export const USE_EMULATOR = new InjectionToken<ɵUseEmulatorArguments>('angularfire2.firestore.use-emulator');

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

export interface AngularFirestore extends Omit<ɵPromiseProxy<firebase.firestore.Firestore>, 'doc' | 'collection' | 'collectionGroup'> {}

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

  public readonly persistenceEnabled$: Observable<boolean>;
  public readonly schedulers: ɵAngularFireSchedulers;
  public readonly keepUnstableUntilFirst: <T>(obs: Observable<T>) => Observable<T>;

  /**
   * Create a reference to a Firestore Collection based on a path or
   * CollectionReference and an optional query function to narrow the result
   * set.
   */
  public readonly collection: <T>(pathOrRef: string | CollectionReference<T>, queryFn?: QueryFn) => AngularFirestoreCollection<T>;

  /**
   * Create a reference to a Firestore Collection Group based on a collectionId
   * and an optional query function to narrow the result
   * set.
   */
  public readonly collectionGroup: <T>(collectionId: string, queryGroupFn?: QueryGroupFn<T>) => AngularFirestoreCollectionGroup<T>;

  /**
   * Create a reference to a Firestore Document based on a path or
   * DocumentReference. Note that documents are not queryable because they are
   * simply objects. However, documents have sub-collections that return a
   * Collection reference and can be queried.
   */
  public readonly doc: <T>(pathOrRef: string | DocumentReference<T>) => AngularFirestoreDocument<T>;

  /**
   * Returns a generated Firestore Document Id.
   */
  public readonly createId = () => newId();

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig: string | FirebaseAppConfig | null | undefined,
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

    const firestoreAndPersistenceEnabled = of(undefined).pipe(
      observeOn(this.schedulers.outsideAngular),
      // TODO wait for AngularFireAuth if it's available
      switchMap(() => zone.runOutsideAngular(() => import('firebase/firestore'))),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => zone.runOutsideAngular(() => {
        const useEmulator: ɵUseEmulatorArguments | null = _useEmulator;
        return ɵfetchInstance(`${app.name}.firestore`, 'AngularFirestore', app, () => {
          const firestore = zone.runOutsideAngular(() => app.firestore());
          if (settings) {
            firestore.settings(settings);
          }
          if (useEmulator) {
            firestore.useEmulator(...useEmulator);
          }

          if (shouldEnablePersistence && !isPlatformServer(platformId)) {
            // We need to try/catch here because not all enablePersistence() failures are caught
            // https://github.com/firebase/firebase-js-sdk/issues/608
            const enablePersistence = () => {
              try {
                return from(firestore.enablePersistence(persistenceSettings || undefined).then(() => true, () => false));
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
      })),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    const firestore = firestoreAndPersistenceEnabled.pipe(map(([firestore]) => firestore as firebase.firestore.Firestore));
    this.persistenceEnabled$ = firestoreAndPersistenceEnabled.pipe(switchMap(([_, it]) => it as Observable<boolean>));

    this.collection = <T>(pathOrRef: string | CollectionReference<T>, queryFn?: QueryFn) => {
      const zoneAndQuery = firestore.pipe(map(firestoreInstance => {
        let collectionRef: CollectionReference<T>;
        if (typeof pathOrRef === 'string') {
          collectionRef = firestoreInstance.collection(pathOrRef) as firebase.firestore.CollectionReference<T>;
        } else {
          collectionRef = pathOrRef;
        }
        return associateQuery<T>(collectionRef, queryFn);
      }));
      const ref = zoneAndQuery.pipe(map(it => this.schedulers.ngZone.run(() => it.ref)));
      const query = zoneAndQuery.pipe(map(it => it.query));
      return new AngularFirestoreCollection<T>(ref, query, this);
    };

    this.doc = <T>(pathOrRef: string | DocumentReference<T>) => {
      const ref = firestore.pipe(
        map(firestoreInstance => {
          if (typeof pathOrRef === 'string') {
            return firestoreInstance.doc(pathOrRef) as DocumentReference<T>;
          } else {
            return pathOrRef;
          }
        }),
        map(ref => this.schedulers.ngZone.run(() => ref))
      );
      return new AngularFirestoreDocument<T>(ref, this);
    };

    this.collectionGroup = <T>(collectionId: string, queryGroupFn?: QueryGroupFn<T>) => {
      const queryFn = queryGroupFn || (ref => ref);
      const query = firestore.pipe(map(firestoreInstance => {
        const collectionGroup: Query<T> = firestoreInstance.collectionGroup(collectionId) as firebase.firestore.Query<T>;
        return queryFn(collectionGroup);
      }));
      return new AngularFirestoreCollectionGroup<T>(query, this);
    };

    return ɵlazySDKProxy(this, firestore, zone);

  }

}

ɵapplyMixins(AngularFirestore, [proxyPolyfillCompat]);
