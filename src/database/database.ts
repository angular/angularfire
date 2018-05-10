import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { FirebaseDatabase } from '@firebase/database-types';
import { PathReference, DatabaseQuery, DatabaseReference, DatabaseSnapshot, ChildEvent, ListenEvent, QueryFn, AngularFireList, AngularFireObject } from './interfaces';
import { getRef } from './utils';
import { InjectionToken } from '@angular/core';
import { FirebaseOptions, FirebaseAppConfig } from '@firebase/app-types';
import { createListReference } from './list/create-reference';
import { createObjectReference } from './object/create-reference';
import { FirebaseOptionsToken, AppNameToken, DatabaseURLToken, FirebaseAppConfigToken, _firebaseAppFactory, FirebaseZoneScheduler } from 'angularfire2';

@Injectable()
export class AngularFireDatabase {
  public readonly database: FirebaseDatabase;
  public readonly scheduler: FirebaseZoneScheduler;

  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseAppConfigToken) config:FirebaseAppConfig,
    @Optional() @Inject(AppNameToken) name:string,
    @Optional() @Inject(DatabaseURLToken) databaseURL:string,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    this.scheduler = new FirebaseZoneScheduler(zone, platformId);
    this.database = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, name, config);
      return app.database(databaseURL || undefined);
    });
  }

  list<T>(pathOrRef: PathReference, queryFn?: QueryFn): AngularFireList<T> {
    const ref = getRef(this.database, pathOrRef);
    let query: DatabaseQuery = ref;
    if(queryFn) {
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

export { DatabaseURLToken };