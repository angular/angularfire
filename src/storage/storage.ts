import { Injectable } from '@angular/core';
import { FirebaseStorage, UploadMetadata } from '@firebase/storage-types';
import { FirebaseApp } from 'angularfire2';
import { createStorageRef, AngularFireStorageReference } from './ref';
import { createUploadTask, AngularFireUploadTask } from './task';
import { Observable } from 'rxjs/Observable';

/**
 * AngularFireStorage Service
 *
 * This service is the main entry point for this feature module. It provides
 * an API for uploading and downloading binary files from Cloud Storage for
 * Firebase.
 */
@Injectable()
export class AngularFireStorage {
  storage: FirebaseStorage;

    constructor(public app: FirebaseApp) {
      this.storage = app.storage();
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
