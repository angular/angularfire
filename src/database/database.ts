import { Injectable, Inject, Optional, NgZone, ApplicationRef } from '@angular/core';
import { FirebaseDatabase } from '@firebase/database-types';
import { PathReference, DatabaseQuery, DatabaseReference, DatabaseSnapshot, ChildEvent, ListenEvent, QueryFn, AngularFireList, AngularFireObject } from './interfaces';
import { getRef } from './utils';
import { InjectionToken } from '@angular/core';
import { FirebaseOptions } from '@firebase/app-types';
import { createListReference } from './list/create-reference';
import { createObjectReference } from './object/create-reference';
import { FirebaseAppConfig, FirebaseAppName, RealtimeDatabaseURL, UniversalDatabaseTransferStateKeyPrefix, _firebaseAppFactory, FirebaseZoneScheduler } from 'angularfire2';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import 'rxjs/add/operator/take';

@Injectable()
export class AngularFireDatabase {
  public readonly database: FirebaseDatabase;
  public readonly scheduler: FirebaseZoneScheduler;
  private readFromCache = true;

  constructor(
    @Inject(FirebaseAppConfig) config:FirebaseOptions,
    @Optional() @Inject(FirebaseAppName) name:string,
    @Optional() @Inject(RealtimeDatabaseURL) databaseURL:string,
    @Inject(UniversalDatabaseTransferStateKeyPrefix) private cacheKeyPrefix:string,
    private ts: TransferState,
    appRef: ApplicationRef,
    zone: NgZone
  ) {
    this.scheduler = new FirebaseZoneScheduler(zone);
    this.database = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(config, name);
      return app.database(databaseURL || undefined);
    });
    appRef.isStable.filter(Boolean).take(1).subscribe(() => this.readFromCache = false)
  }

  list<T>(pathOrRef: PathReference, queryFn?: QueryFn): AngularFireList<T> {
    const ref = getRef(this.database, pathOrRef);
    const ssrCached = this.readFromCache && this.getValueFromServerRequest<T>(pathOrRef.toString()) || undefined
    let query: DatabaseQuery = ref;
    if(queryFn) {
      query = queryFn(ref);
    }
    return createListReference<T>(query, this);
  }

  object<T>(pathOrRef: PathReference): AngularFireObject<T>  {
    const ref = getRef(this.database, pathOrRef);
    const ssrCached = this.readFromCache && this.getValueFromServerRequest<T>(pathOrRef.toString()) || undefined
    return createObjectReference<T>(ref, this, ssrCached);
  }

  createPushId() {
    return this.database.ref().push().key;
  }

  private getValueFromServerRequest<T>(path: string) {
    return this.ts.get<T | undefined>(this.getTsCacheKey(path), undefined);
  }

  private getTsCacheKey(path: string) {
    return makeStateKey<string>(`${this.cacheKeyPrefix}.${path}`);
  }
}

export {
  PathReference,
  DatabaseQuery,
  DatabaseReference,
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

export { RealtimeDatabaseURL };