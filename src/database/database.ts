import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { DatabaseQuery, PathReference, QueryFn, AngularFireList, AngularFireObject } from './interfaces';
import { getRef } from './utils';
import { createListReference } from './list/create-reference';
import { createObjectReference } from './object/create-reference';
import { FirebaseDatabase, FirebaseOptions, FirebaseAppConfig, DATABASE_URL, FIREBASE_OPTIONS, FIREBASE_APP_NAME, ɵfirebaseAppFactory, ɵFirebaseZoneScheduler } from '@angular/fire';

@Injectable({
  providedIn: 'root'
})
export class AngularFireDatabase {
  public readonly database: FirebaseDatabase;
  public readonly scheduler: ɵFirebaseZoneScheduler;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(DATABASE_URL) databaseURL:string|null,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    this.scheduler = new ɵFirebaseZoneScheduler(zone, platformId);
    this.database = zone.runOutsideAngular(() => {
      const app = ɵfirebaseAppFactory(options, zone, nameOrConfig);
      if (!app.database) { throw "You must import 'firebase/database' before using AngularFireDatabase" }
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

export { DATABASE_URL as URL };