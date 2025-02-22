import { EnvironmentInjector, Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID, inject } from '@angular/core';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { AppCheckInstances } from '@angular/fire/app-check';
import { FIREBASE_APP_NAME, FIREBASE_OPTIONS, ɵcacheInstance, ɵfirebaseAppFactory } from '@angular/fire/compat';
import { FirebaseOptions } from 'firebase/app';
import firebase from 'firebase/compat/app';
import { UploadMetadata } from './interfaces';
import { createStorageRef } from './ref';
import 'firebase/compat/storage';

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
  private readonly injector = inject(EnvironmentInjector);

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) name: string | null | undefined,
    @Optional() @Inject(BUCKET) storageBucket: string | null,
    // eslint-disable-next-line @typescript-eslint/ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    schedulers: ɵAngularFireSchedulers,
    @Optional() @Inject(MAX_UPLOAD_RETRY_TIME) maxUploadRetryTime: any,
    @Optional() @Inject(MAX_OPERATION_RETRY_TIME) maxOperationRetryTime: any,
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
    return createStorageRef(this.storage.ref(path), this.injector);
  }

  refFromURL(path: string) {
    return createStorageRef(this.storage.refFromURL(path), this.injector);
  }

  upload(path: string, data: any, metadata?: UploadMetadata) {
    const storageRef = this.storage.ref(path);
    const ref = createStorageRef(storageRef, this.injector);
    return ref.put(data, metadata);
  }

}
