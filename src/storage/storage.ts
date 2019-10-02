import { Injectable, Inject, Optional, InjectionToken, NgZone, PLATFORM_ID } from '@angular/core';
import { createStorageRef, AngularFireStorageReference } from './ref';
import { createUploadTask, AngularFireUploadTask } from './task';
import { Observable } from 'rxjs';
import { FirebaseStorage, FirebaseOptions, FirebaseAppConfig, FirebaseZoneScheduler, _firebaseAppFactory, FIREBASE_OPTIONS, FIREBASE_APP_NAME } from '@angular/fire';

import { UploadMetadata } from './interfaces';

export const StorageBucket = new InjectionToken<string>('angularfire2.storageBucket');

export const STORAGE_BUCKET = StorageBucket;

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
  public readonly scheduler: FirebaseZoneScheduler;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(STORAGE_BUCKET) storageBucket:string|null,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    this.scheduler = new FirebaseZoneScheduler(zone, platformId);
    this.storage = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, nameOrConfig);
      return app.storage(storageBucket || undefined);
    });
  }

  ref(path: string) {
    return createStorageRef(this.storage.ref(path), this.scheduler);
  }

  upload(path: string, data: any, metadata?: UploadMetadata) {
    const storageRef = this.storage.ref(path);
    const ref = createStorageRef(storageRef, this.scheduler);
    return ref.put(data, metadata);
  }

}
