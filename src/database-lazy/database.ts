import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { AngularFireList, AngularFireObject, PathReference, QueryFn } from './interfaces';
import { getRef } from './utils';
import { createListReference } from './list/create-reference';
import { createObjectReference } from './object/create-reference';
import {
  FIREBASE_APP_NAME,
  FIREBASE_OPTIONS,
  FirebaseAppConfig,
  FirebaseOptions,
  ɵAngularFireSchedulers,
  ɵfirebaseAppFactory,
  ɵkeepUnstableUntilFirstFactory,
  ɵlazySDKProxy,
  ɵapplyMixins,
  ɵPromiseProxy,
} from '@angular/fire';
import { Observable, of } from 'rxjs';
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/auth';
import { ɵfetchInstance } from '@angular/fire';
import { map, observeOn, switchMap } from 'rxjs/operators';
import { proxyPolyfillCompat } from './base';
import firebase from 'firebase/app';

export const URL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

// SEMVER(7): use Parameters to detirmine the useEmulator arguments
// TODO(jamesdaniels): don't hardcode, but having tyepscript issues with firebase.database.Database
// type UseEmulatorArguments = Parameters<typeof firebase.database.Database.prototype.useEmulator>;
type UseEmulatorArguments = [string, number];
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.database.use-emulator');


export interface AngularFireDatabase extends ɵPromiseProxy<firebase.database.Database> {}

@Injectable({
  providedIn: 'any'
})
export class AngularFireDatabase {

  public readonly schedulers: ɵAngularFireSchedulers;
  public readonly keepUnstableUntilFirst: <T>(obs$: Observable<T>) => Observable<T>;

  public readonly list: <T>(pathOrRef: PathReference, queryFn?: QueryFn) => AngularFireList<T>;
  public readonly object: <T>(pathOrRef: PathReference) => AngularFireObject<T>;
  public readonly createPushId: () => Promise<string>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig: string | FirebaseAppConfig | null | undefined,
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

    const database$ = of(undefined).pipe(
      observeOn(this.schedulers.outsideAngular),
      switchMap(() => zone.runOutsideAngular(() => import('firebase/database'))),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app =>
        ɵfetchInstance(`${app.name}.database.${databaseURL}`, 'AngularFireDatabase', app, () => {
          const database = zone.runOutsideAngular(() => app.database(databaseURL || undefined));
          if (useEmulator) {
            database.useEmulator(...useEmulator);
          }
          return database;
        }, [useEmulator])
      )
    );

    this.list = <T>(pathOrRef: PathReference, queryFn: QueryFn = ((fn) => fn)) => {
      const query$ = database$.pipe(map(database => {
        const ref = this.schedulers.ngZone.runOutsideAngular(() => getRef(database, pathOrRef));
        return queryFn(ref);
      }));
      return createListReference<T>(query$, this);
    };

    this.object = <T>(pathOrRef: PathReference) => {
      const ref$ = database$.pipe(map(database =>
        this.schedulers.ngZone.runOutsideAngular(() => getRef(database, pathOrRef))
      ));
      return createObjectReference<T>(ref$, this);
    };

    this.createPushId = () => database$.pipe(
      map(database => this.schedulers.ngZone.runOutsideAngular(() => database.ref())),
      map(ref => ref.push().key),
    ).toPromise();

    return ɵlazySDKProxy(this, database$, zone);

  }

}

ɵapplyMixins(AngularFireDatabase, [proxyPolyfillCompat]);


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
