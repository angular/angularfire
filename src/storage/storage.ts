import * as firebase from 'firebase/app';
import 'firebase/storage';
import { Injectable } from '@angular/core';
import { Storage, UploadMetadata, StoragePathReference, UploadTaskSnapshot } from '../interfaces';
import { FirebaseApp } from '../app/index';
import { FirebaseUploadTaskObservable } from './firebase_upload_task_observable';
import { FirebaseUploadTaskFactory } from './firebase_upload_task_factory';
import * as utils from '../utils';

@Injectable()
export class AngularFireStorage {

  /**
   * Firebase Storage instance
   */
  storage: firebase.storage.Storage;

  constructor(public app: FirebaseApp) {
    this.storage = app.storage();
  }

  upload(pathOrRef: StoragePathReference, data: Blob | Uint8Array | ArrayBuffer, metadata: UploadMetadata = {}):FirebaseUploadTaskObservable<UploadTaskSnapshot> {
    const ref = utils.getStorageRef(this.app, pathOrRef);
    const uploadTask = ref.put(data, metadata);
    return FirebaseUploadTaskFactory(uploadTask);
  }

}