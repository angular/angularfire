import { Injectable, Inject, Optional, InjectionToken, NgZone, PLATFORM_ID } from '@angular/core';
import { createStorageRef } from './ref';
import { FirebaseStorage, FirebaseOptions, FirebaseAppConfig, ɵFirebaseZoneScheduler, ɵfirebaseAppFactory, FIREBASE_OPTIONS, FIREBASE_APP_NAME } from '@angular/fire';
import { UploadMetadata } from './interfaces';

export const BUCKET = new InjectionToken<string>('angularfire2.storageBucket');

/**
 * AngularFireStorage Service
 *
 * This service is the main entry point for this feature module. It provides
 * an API for uploading and downloading binary files from Cloud Storage for
 * Firebase.
 */
@Injectable({
  providedIn: 'root'
})
export class AngularFireStorage {
  public readonly storage: FirebaseStorage;
  public readonly scheduler: ɵFirebaseZoneScheduler;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(BUCKET) storageBucket:string|null,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    this.scheduler = new ɵFirebaseZoneScheduler(zone, platformId);
    this.storage = zone.runOutsideAngular(() => {
      const app = ɵfirebaseAppFactory(options, zone, nameOrConfig);
      if (!app.storage) { throw "You must import 'firebase/database' before using AngularFireDatabase" }
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
