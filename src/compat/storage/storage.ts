import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { createStorageRef } from './ref';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { FirebaseOptions } from 'firebase/app';
import { ɵfirebaseAppFactory, FIREBASE_APP_NAME, FIREBASE_OPTIONS, ɵcacheInstance } from '@angular/fire/compat';
import { UploadMetadata } from './interfaces';
import 'firebase/compat/storage';
import firebase from 'firebase/compat/app';
import { AppCheckInstances } from '@angular/fire';

export const BUCKET = new InjectionToken<string>('angularfire2.storageBucket');
export const MAX_UPLOAD_RETRY_TIME = new InjectionToken<number>('angularfire2.storage.maxUploadRetryTime');
export const MAX_OPERATION_RETRY_TIME = new InjectionToken<number>('angularfire2.storage.maxOperationRetryTime');

type UseEmulatorArguments = Parameters<firebase.storage.Storage['useEmulator']>;
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.storage.use-emulator');

/**
 * AngularFireStorage Service
 *
 * This service is the main entry point for this feature module. It provides
 * an API for uploading and downloading binary files from Cloud Storage for
 * Firebase.
 */
@Injectable({
  providedIn: 'any'
})
export class AngularFireStorage {
  public readonly storage: firebase.storage.Storage;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) name: string | null | undefined,
    @Optional() @Inject(BUCKET) storageBucket: string | null,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    schedulers: ɵAngularFireSchedulers,
    @Optional() @Inject(MAX_UPLOAD_RETRY_TIME) maxUploadRetryTime: number | any,
    @Optional() @Inject(MAX_OPERATION_RETRY_TIME) maxOperationRetryTime: number | any,
    @Optional() @Inject(USE_EMULATOR) _useEmulator: any,
    @Optional() _appCheckInstances: AppCheckInstances,
  ) {
    const app = ɵfirebaseAppFactory(options, zone, name);
    this.storage = ɵcacheInstance(`${app.name}.storage.${storageBucket}`, 'AngularFireStorage', app.name, () => {
      const storage = zone.runOutsideAngular(() => app.storage(storageBucket || undefined));
      const useEmulator = _useEmulator as UseEmulatorArguments|null;
      if (useEmulator) {
        storage.useEmulator(...useEmulator);
      }
      if (maxUploadRetryTime) {
        storage.setMaxUploadRetryTime(maxUploadRetryTime);
      }
      if (maxOperationRetryTime) {
        storage.setMaxOperationRetryTime(maxOperationRetryTime);
      }
      return storage;
    }, [maxUploadRetryTime, maxOperationRetryTime]);
  }

  ref(path: string) {
    return createStorageRef(this.storage.ref(path));
  }

  refFromURL(path: string) {
    return createStorageRef(this.storage.refFromURL(path));
  }

  upload(path: string, data: any, metadata?: UploadMetadata) {
    const storageRef = this.storage.ref(path);
    const ref = createStorageRef(storageRef);
    return ref.put(data, metadata);
  }

}
