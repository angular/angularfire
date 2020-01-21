import { Injectable, Inject, Optional, InjectionToken, NgZone, PLATFORM_ID } from '@angular/core';
import { createStorageRef, AngularFireStorageReference } from './ref';
import { createUploadTask, AngularFireUploadTask } from './task';
import { Observable } from 'rxjs';
import { FirebaseStorage, FirebaseOptions, FirebaseAppConfig, _firebaseAppFactory, FIREBASE_OPTIONS, FIREBASE_APP_NAME, ɵkeepUnstableUntilFirstFactory, ɵAngularFireSchedulers } from '@angular/fire';

import { UploadMetadata } from './interfaces';

// SEMVER drop StorageBucket in favor of BUCKET
export const StorageBucket = new InjectionToken<string>('angularfire2.storageBucket');
export const BUCKET = StorageBucket;

/**
 * AngularFireStorage Service
 *
 * This service is the main entry point for this feature module. It provides
 * an API for uploading and downloading binary files from Cloud Storage for
 * Firebase.
 */
@Injectable()
export class AngularFireStorage {
  public readonly storage: FirebaseStorage;

  public readonly keepUnstableUntilFirst: <T>(obs: Observable<T>) => Observable<T>;
  public readonly schedulers: ɵAngularFireSchedulers;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(BUCKET) storageBucket:string|null,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    this.schedulers = new ɵAngularFireSchedulers(zone);
    this.keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(this.schedulers, platformId);

    this.storage = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, zone, nameOrConfig);
      return app.storage(storageBucket || undefined);
    });
  }

  ref(path: string) {
    return createStorageRef(this.storage.ref(path), this.schedulers, this.keepUnstableUntilFirst);
  }

  upload(path: string, data: any, metadata?: UploadMetadata) {
    const storageRef = this.storage.ref(path);
    const ref = createStorageRef(storageRef, this.schedulers, this.keepUnstableUntilFirst);
    return ref.put(data, metadata);
  }

}
