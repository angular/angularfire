import { Injectable, Inject, Optional, InjectionToken, NgZone, PLATFORM_ID } from '@angular/core';
import { FirebaseStorage, UploadMetadata } from '@firebase/storage-types';
import { createStorageRef, AngularFireStorageReference } from './ref';
import { createUploadTask, AngularFireUploadTask } from './task';
import { Observable } from 'rxjs/Observable';
import { FirebaseOptionsToken, FirebaseAppNameToken, FirebaseZoneScheduler, FirebaseAppConfigToken, _firebaseAppFactory } from 'angularfire2';
import { FirebaseOptions, FirebaseAppConfig } from '@firebase/app-types';

export const StorageBucketToken = new InjectionToken<string>('angularfire2.storageBucket');

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
    @Optional() @Inject(FirebaseAppConfigToken) config:FirebaseAppConfig,
    @Optional() @Inject(FirebaseAppNameToken) name:string,
    @Optional() @Inject(StorageBucketToken) storageBucket:string,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    this.scheduler = new FirebaseZoneScheduler(zone, platformId);
    this.storage = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, name, config);
      return app.storage!(storageBucket || undefined);
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
