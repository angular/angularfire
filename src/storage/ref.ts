import { storage } from 'firebase/app';
import { AngularFireUploadTask } from './task';

export class AngularFireStorageRef {
  constructor(public ref: storage.Reference) { }
  put(data: any, metadata: storage.UploadMetadata | undefined) {
    const task = this.ref.put(data, metadata);
    return new AngularFireUploadTask(task);
  }
}

