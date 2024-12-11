import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID, inject } from '@angular/core';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { AppCheckInstances } from '@angular/fire/app-check';
import { FIREBASE_APP_NAME, FIREBASE_OPTIONS, ɵcacheInstance, ɵfirebaseAppFactory } from '@angular/fire/compat';
import {
  SETTINGS as AUTH_SETTINGS,
  AngularFireAuth,
  LANGUAGE_CODE,
  PERSISTENCE,
  TENANT_ID,
  USE_EMULATOR as USE_AUTH_EMULATOR,
  USE_DEVICE_LANGUAGE,
  ɵauthFactory,
} from '@angular/fire/compat/auth';
import { FirebaseOptions } from 'firebase/app';
import firebase from 'firebase/compat/app';
import { AngularFireList, AngularFireObject, DatabaseQuery, PathReference, QueryFn } from './interfaces';
import { createListReference } from './list/create-reference';
import { createObjectReference } from './object/create-reference';
import { getRef } from './utils';
import 'firebase/compat/auth';
import 'firebase/compat/database';

export const URL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

type UseEmulatorArguments = Parameters<firebase.database.Database['useEmulator']>;
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.database.use-emulator');

@Injectable({
  providedIn: 'any'
})
export class AngularFireDatabase {
  public readonly database: firebase.database.Database;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) name: string | null | undefined,
    @Optional() @Inject(URL) databaseURL: string | null,
    // eslint-disable-next-line @typescript-eslint/ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    public schedulers: ɵAngularFireSchedulers,
    @Optional() @Inject(USE_EMULATOR) _useEmulator: any, // tuple isn't working here
    @Optional() auth: AngularFireAuth,
    @Optional() @Inject(USE_AUTH_EMULATOR) useAuthEmulator: any,
    @Optional() @Inject(AUTH_SETTINGS) authSettings: any, // can't use firebase.auth.AuthSettings here
    @Optional() @Inject(TENANT_ID) tenantId: string | null,
    @Optional() @Inject(LANGUAGE_CODE) languageCode: string | null,
    @Optional() @Inject(USE_DEVICE_LANGUAGE) useDeviceLanguage: boolean | null,
    @Optional() @Inject(PERSISTENCE) persistence: string | null,
    @Optional() _appCheckInstances: AppCheckInstances,
  ) {

    const useEmulator: UseEmulatorArguments | null = _useEmulator;
    const app = ɵfirebaseAppFactory(options, zone, name);

    if (auth) {
      ɵauthFactory(app, zone, useAuthEmulator, tenantId, languageCode, useDeviceLanguage, authSettings, persistence);
    }

    this.database = ɵcacheInstance(`${app.name}.database.${databaseURL}`, 'AngularFireDatabase', app.name, () => {
      const database = zone.runOutsideAngular(() => app.database(databaseURL || undefined));
      if (useEmulator) {
        database.useEmulator(...useEmulator);
      }
      return database;
    }, [useEmulator]);
  }

  list<T>(pathOrRef: PathReference, queryFn?: QueryFn): AngularFireList<T> {
    const ref = inject(NgZone).runOutsideAngular(() => getRef(this.database, pathOrRef));
    let query: DatabaseQuery = ref;
    if (queryFn) {
      query = queryFn(ref);
    }
    return createListReference<T>(query, this);
  }

  object<T>(pathOrRef: PathReference): AngularFireObject<T> {
    const ref = inject(NgZone).runOutsideAngular(() => getRef(this.database, pathOrRef));
    return createObjectReference<T>(ref, this);
  }

  createPushId() {
    const ref = inject(NgZone).runOutsideAngular(() => this.database.ref());
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
