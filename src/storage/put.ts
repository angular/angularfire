import { storage } from 'firebase/app';
import { createUploadTask } from './task';
import { Observable } from 'rxjs/Observable';

/**
 * A higher order function (function that makes a function) that 
 * starts an upload and creates an AngularFire wrapped upload task.
 * @param ref 
 */
export function createPut(ref: storage.Reference) {
  return function put(data: any, metadata?: storage.UploadMetadata) {
    const task = ref.put(data, metadata);
    return createUploadTask(task);
  }
}
