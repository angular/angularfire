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
import { ɵAngularFireSchedulers } from '@angular/fire';
import { FirebaseApp, ɵfirebaseAppFactory, FIREBASE_APP_NAME, FIREBASE_OPTIONS } from '@angular/fire/compat';
import { FirebaseOptions } from 'firebase/app';
import { isPlatformServer } from '@angular/common';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {
  AngularFireAuth,
  USE_EMULATOR as USE_AUTH_EMULATOR,
  SETTINGS as AUTH_SETTINGS,
  TENANT_ID,
  LANGUAGE_CODE,
  USE_DEVICE_LANGUAGE,
  PERSISTENCE,
  ɵauthFactory,
} from '@angular/fire/compat/auth';
import { ɵcacheInstance } from '@angular/fire';
import { AppCheckInstances } from '@angular/fire/app-check';

/**
 * The value of this token determines whether or not the firestore will have persistance enabled
 */
export const ENABLE_PERSISTENCE = new InjectionToken<boolean>('angularfire2.enableFirestorePersistence');
export const PERSISTENCE_SETTINGS = new InjectionToken<PersistenceSettings | undefined>('angularfire2.firestore.persistenceSettings');
export const SETTINGS = new InjectionToken<Settings>('angularfire2.firestore.settings');

type UseEmulatorArguments = Parameters<firebase.firestore.Firestore['useEmulator']>;
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
  firebase.firestore.Firestore,
  firebase.firestore.Settings | null,
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
  public readonly firestore: firebase.firestore.Firestore;
  public readonly persistenceEnabled$: Observable<boolean>;

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
    public schedulers: ɵAngularFireSchedulers,
    @Optional() @Inject(PERSISTENCE_SETTINGS) persistenceSettings: PersistenceSettings | null,
    @Optional() @Inject(USE_EMULATOR) _useEmulator: any,
    @Optional() auth: AngularFireAuth,
    @Optional() @Inject(USE_AUTH_EMULATOR) useAuthEmulator: any,
    @Optional() @Inject(AUTH_SETTINGS) authSettings: any, // can't use firebase.auth.AuthSettings here
    @Optional() @Inject(TENANT_ID) tenantId: string | null,
    @Optional() @Inject(LANGUAGE_CODE) languageCode: string | null,
    @Optional() @Inject(USE_DEVICE_LANGUAGE) useDeviceLanguage: boolean | null,
    @Optional() @Inject(PERSISTENCE) persistence: string | null,
    @Optional() _appCheckInstances: AppCheckInstances,
  ) {
    const app = ɵfirebaseAppFactory(options, zone, name);
    const useEmulator: UseEmulatorArguments | null = _useEmulator;

    if (auth) {
      ɵauthFactory(app, zone, useAuthEmulator, tenantId, languageCode, useDeviceLanguage, authSettings, persistence);
    }

    [this.firestore, this.persistenceEnabled$] = ɵcacheInstance(`${app.name}.firestore`, 'AngularFirestore', app.name, () => {
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
      collectionRef = this.firestore.collection(pathOrRef) as firebase.firestore.CollectionReference<T>;
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
    const collectionGroup: Query<T> = this.firestore.collectionGroup(collectionId) as firebase.firestore.Query<T>;
    return new AngularFirestoreCollectionGroup<T>(queryFn(collectionGroup), this);
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
      ref = this.firestore.doc(pathOrRef) as firebase.firestore.DocumentReference<T>;
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
    return this.firestore.collection('_').doc().id;
  }
}
