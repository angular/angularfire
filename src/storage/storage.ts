import { Injectable } from '@angular/core';
import { storage } from 'firebase/app';
import 'firebase/storage';
import { FirebaseApp } from 'angularfire2';
import { AngularFireStorageRef } from './ref';
import { AngularFireUploadTask } from './task';

@Injectable()
export class AngularFireStorage {
  storage: storage.Storage;
  
    constructor(public app: FirebaseApp) {
      this.storage = app.storage();
    }

    ref(path: string) {
      return new AngularFireStorageRef(this.storage.ref(path));
    }

    upload(pathOrRef: string, data: any, metadata?: storage.UploadMetadata) {
      const storageRef = this.storage.ref(pathOrRef);
      const ref = new AngularFireStorageRef(storageRef);
      return ref.put(data, metadata);
    }

}
