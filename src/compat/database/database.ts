import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { AngularFireList, AngularFireObject, DatabaseQuery, PathReference, QueryFn } from './interfaces';
import { getRef } from './utils';
import { createListReference } from './list/create-reference';
import { createObjectReference } from './object/create-reference';
import {
  ɵAngularFireSchedulers,
  ɵkeepUnstableUntilFirstFactory,
} from '@angular/fire';
import { FirebaseOptions } from 'firebase/app';
import { ɵfirebaseAppFactory, FIREBASE_APP_NAME, FIREBASE_OPTIONS } from '@angular/fire/compat';
import { Observable } from 'rxjs';
import 'firebase/compat/database';
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { ɵfetchInstance, ɵlogAuthEmulatorError } from '@angular/fire';

export const URL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

// SEMVER(7): use Parameters to detirmine the useEmulator arguments
// TODO(jamesdaniels): don't hardcode, but having tyepscript issues with firebase.database.Database
// type UseEmulatorArguments = Parameters<typeof firebase.database.Database.prototype.useEmulator>;
type UseEmulatorArguments = [string, number];
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.database.use-emulator');

@Injectable({
  providedIn: 'any'
})
export class AngularFireDatabase {
  public readonly database: firebase.database.Database;

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
    @Optional() @Inject(USE_AUTH_EMULATOR) useAuthEmulator: any,
  ) {
    this.schedulers = new ɵAngularFireSchedulers(zone);
    this.keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(this.schedulers);

    const useEmulator: UseEmulatorArguments | null = _useEmulator;
    const app = ɵfirebaseAppFactory(options, zone, name);

    if (!firebase.auth && useAuthEmulator) {
      ɵlogAuthEmulatorError();
    }

    this.database = ɵfetchInstance(`${app.name}.database.${databaseURL}`, 'AngularFireDatabase', app, () => {
      const database = zone.runOutsideAngular(() => app.database(databaseURL || undefined));
      if (useEmulator) {
        database.useEmulator(...useEmulator);
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
    const ref = this.schedulers.ngZone.runOutsideAngular(() => this.database.ref());
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
