import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { DatabaseQuery, PathReference, DatabaseSnapshot, ChildEvent, ListenEvent, QueryFn, AngularFireList, AngularFireObject } from './interfaces';
import { getRef } from './utils';
import { InjectionToken } from '@angular/core';
import { createListReference } from './list/create-reference';
import { createObjectReference } from './object/create-reference';
import { FirebaseDatabase, FirebaseOptions, FirebaseAppConfig, FirebaseOptionsToken, FirebaseNameOrConfigToken, RealtimeDatabaseURL, _firebaseAppFactory, FirebaseZoneScheduler, TypicalDependencyInjection } from '@angular/fire';

// TODO clean up anys
export const getInstance =
  (config: TypicalDependencyInjection & { databaseURL?: string }) =>
    new AngularFireDatabase(config.options,( <any>config).appName || (<any>config).appConfig, config.databaseURL || null, config.platformId, config.zone);

@Injectable()
export class AngularFireDatabase {
  public readonly database: FirebaseDatabase;
  public readonly scheduler: FirebaseZoneScheduler;

  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseNameOrConfigToken) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(RealtimeDatabaseURL) databaseURL:string|null,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    this.scheduler = new FirebaseZoneScheduler(zone, platformId);
    this.database = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, nameOrConfig);
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