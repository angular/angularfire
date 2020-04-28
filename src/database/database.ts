import { Injectable, Inject, Optional, NgZone, PLATFORM_ID, InjectionToken } from '@angular/core';
import { DatabaseQuery, PathReference, QueryFn, AngularFireList, AngularFireObject } from './interfaces';
import { getRef } from './utils';
import { createListReference } from './list/create-reference';
import { createObjectReference } from './object/create-reference';
import { FirebaseOptions, FirebaseAppConfig, FIREBASE_OPTIONS, FIREBASE_APP_NAME, ɵfirebaseAppFactory, ɵkeepUnstableUntilFirstFactory, ɵAngularFireSchedulers } from '@angular/fire';
import { Observable } from 'rxjs';
import { database } from 'firebase/app';
import 'firebase/database';

export const URL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

@Injectable({
  providedIn: 'any'
})
export class AngularFireDatabase {
  public readonly database: database.Database;

  public readonly schedulers: ɵAngularFireSchedulers;
  public readonly keepUnstableUntilFirst: <T>(obs$: Observable<T>) => Observable<T>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig: string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(URL) databaseURL: string|null,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    this.schedulers = new ɵAngularFireSchedulers(zone);
    this.keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(this.schedulers, platformId);

    this.database = zone.runOutsideAngular(() => {
      const app = ɵfirebaseAppFactory(options, zone, nameOrConfig);
      return app.database(databaseURL || undefined);
    });
  }

  list<T>(pathOrRef: PathReference, queryFn?: QueryFn): AngularFireList<T> {
    const ref = getRef(this.database, pathOrRef);
    let query: DatabaseQuery = ref;
    if (queryFn) {
      query = queryFn(ref);
    }
    return createListReference<T>(query, this);
  }

  object<T>(pathOrRef: PathReference): AngularFireObject<T>  {
    const ref = getRef(this.database, pathOrRef);
    return createObjectReference<T>(ref, this);
  }

  createPushId() {
    return this.database.ref().push().key;
  }

}

export {
  PathReference,
  DatabaseSnapshot,
  ChildEvent,
  ListenEvent,
  QueryFn,
  AngularFireList,
  AngularFireObject,
  AngularFireAction,
  Action,
  SnapshotAction
} from './interfaces';
