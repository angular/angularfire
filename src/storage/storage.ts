import { Injectable, Inject, Optional, InjectionToken, NgZone, PLATFORM_ID } from '@angular/core';
import { createStorageRef, AngularFireStorageReference } from './ref';
import { createUploadTask, AngularFireUploadTask } from './task';
import { Observable } from 'rxjs';
import { FirebaseStorage, FirebaseOptions, FirebaseAppConfig, FirebaseOptionsToken, FirebaseNameOrConfigToken, FirebaseZoneScheduler, _firebaseAppFactory } from 'angularfire2';

import { UploadMetadata } from './interfaces';

export const StorageBucket = new InjectionToken<string>('angularfire2.storageBucket');

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
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseNameOrConfigToken) nameOrConfig:string|FirebaseAppConfig|undefined,
    @Optional() @Inject(StorageBucket) storageBucket:string,
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
