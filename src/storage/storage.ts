import { Injectable, Inject, Optional, InjectionToken } from '@angular/core';
import { FirebaseStorage, UploadMetadata } from '@firebase/storage-types';
import { createStorageRef, AngularFireStorageReference } from './ref';
import { createUploadTask, AngularFireUploadTask } from './task';
import { Observable } from 'rxjs/Observable';
import { FirebaseAppConfig, FirebaseAppName, _firebaseAppFactory } from 'angularfire2';
import { FirebaseOptions } from '@firebase/app-types';

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

  constructor(
    @Inject(FirebaseAppConfig) config:FirebaseOptions,
    @Optional() @Inject(FirebaseAppName) name:string,
    @Optional() @Inject(StorageBucket) storageBucket:string
  ) {
    const app = _firebaseAppFactory(config, name);
    this.storage = app.storage(storageBucket || undefined);
  }

  ref(path: string) {
    return createStorageRef(this.storage.ref(path));
  }

  upload(path: string, data: any, metadata?: UploadMetadata) {
    const storageRef = this.storage.ref(path);
    const ref = createStorageRef(storageRef);
    return ref.put(data, metadata);
  }

}
