import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { AngularFireList, AngularFireObject, DatabaseQuery, PathReference, QueryFn } from './interfaces';
import { getRef } from './utils';
import { createListReference } from './list/create-reference';
import { createObjectReference } from './object/create-reference';
import {
  FIREBASE_APP_NAME,
  FIREBASE_OPTIONS,
  ɵAngularFireSchedulers,
  ɵfirebaseAppFactory,
  ɵkeepUnstableUntilFirstFactory,
} from '@angular/fire';
import { FirebaseOptions } from 'firebase/app';
import { Observable } from 'rxjs';
import { FirebaseDatabase, useDatabaseEmulator, getDatabase } from 'firebase/database';
import { ɵfetchInstance } from '@angular/fire';

export const URL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

// SEMVER(7): use Parameters to detirmine the useEmulator arguments
// TODO(jamesdaniels): don't hardcode, but having tyepscript issues with Database
// type UseEmulatorArguments = Parameters<typeof Database.prototype.useEmulator>;
type UseEmulatorArguments = [string, number];
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.database.use-emulator');

@Injectable({
  providedIn: 'any'
})
export class AngularFireDatabase {
  public readonly database: FirebaseDatabase;

  public readonly schedulers: ɵAngularFireSchedulers;
  public readonly keepUnstableUntilFirst: <T>(obs$: Observable<T>) => Observable<T>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) name: string | null | undefined,
    @Optional() @Inject(URL) databaseURL: string | null,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(USE_EMULATOR) _useEmulator: any, // tuple isn't working here
  ) {
    this.schedulers = new ɵAngularFireSchedulers(zone);
    this.keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(this.schedulers);

    const useEmulator: UseEmulatorArguments | null = _useEmulator;
    const app = ɵfirebaseAppFactory(options, zone, name);

    // TODO(team): Figure out how to get detect potential Authentication instance
    // in vNext world
    // if (!firebase.auth && useAuthEmulator) {
    //   ɵlogAuthEmulatorError();
    // }

    this.database = ɵfetchInstance(`${app.name}.database.${databaseURL}`, 'AngularFireDatabase', app.name, () => {
      const database = zone.runOutsideAngular(() => getDatabase(app, databaseURL || undefined));
      if (useEmulator) {
        useDatabaseEmulator(database, ...useEmulator);
      }
      return database;
    }, [useEmulator]);
  }

  list<T>(pathOrRef: PathReference, queryFn?: QueryFn): AngularFireList<T> {
    const ref = this.schedulers.ngZone.runOutsideAngular(() => getRef(this.database, pathOrRef));
    let query: DatabaseQuery = ref;
    if (queryFn) {
      query = queryFn(ref);
    }
    return createListReference<T>(query, this);
  }

  object<T>(pathOrRef: PathReference): AngularFireObject<T> {
    const ref = this.schedulers.ngZone.runOutsideAngular(() => getRef(this.database, pathOrRef));
    return createObjectReference<T>(ref, this);
  }

  createPushId() {
    const ref = this.schedulers.ngZone.runOutsideAngular(() => ref(this.database));
    return ref.push().key;
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
