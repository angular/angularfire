import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { createStorageRef } from './ref';
import { Observable } from 'rxjs';
import {
  FIREBASE_APP_NAME,
  FIREBASE_OPTIONS,
  FirebaseAppConfig,
  FirebaseOptions,
  ɵAngularFireSchedulers,
  ɵfetchInstance,
  ɵfirebaseAppFactory,
  ɵkeepUnstableUntilFirstFactory
} from '@angular/fire';
import { UploadMetadata, StorageService } from './interfaces';
import { getStorage, ref } from 'firebase/storage';

export const BUCKET = new InjectionToken<string>('angularfire2.storageBucket');
export const MAX_UPLOAD_RETRY_TIME = new InjectionToken<number>('angularfire2.storage.maxUploadRetryTime');
export const MAX_OPERATION_RETRY_TIME = new InjectionToken<number>('angularfire2.storage.maxOperationRetryTime');

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
  public readonly storage: StorageService;

  public readonly keepUnstableUntilFirst: <T>(obs: Observable<T>) => Observable<T>;
  public readonly schedulers: ɵAngularFireSchedulers;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig: string | FirebaseAppConfig | null | undefined,
    @Optional() @Inject(BUCKET) storageBucket: string | null,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(MAX_UPLOAD_RETRY_TIME) maxUploadRetryTime: number | any,
    @Optional() @Inject(MAX_OPERATION_RETRY_TIME) maxOperationRetryTime: number | any,
  ) {
    this.schedulers = new ɵAngularFireSchedulers(zone);
    this.keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(this.schedulers);
    const app = ɵfirebaseAppFactory(options, zone, nameOrConfig);

    this.storage = ɵfetchInstance(`${app.name}.storage.${storageBucket}`, 'AngularFireStorage', app, () => {
      const storage = zone.runOutsideAngular(() => {
        return getStorage(app, storageBucket || undefined);
      });
      if (maxUploadRetryTime) {
        storage.maxUploadRetryTime = maxUploadRetryTime;
      }
      if (maxOperationRetryTime) {
        storage.maxOperationRetryTime = maxOperationRetryTime;
      }
      return storage;
    }, [maxUploadRetryTime, maxOperationRetryTime]);
  }

  ref(path: string) {
    return createStorageRef(this.storage, ref(this.storage, path), this.schedulers, this.keepUnstableUntilFirst);
  }

  refFromURL(path: string) {
    return createStorageRef(this.storage, ref(this.storage, path), this.schedulers, this.keepUnstableUntilFirst);
  }

  upload(path: string, data: any, metadata?: UploadMetadata) {
    const storageRef = ref(this.storage, path);
    const afRef = createStorageRef(this.storage, storageRef, this.schedulers, this.keepUnstableUntilFirst);
    return afRef.put(data, metadata);
  }

}
