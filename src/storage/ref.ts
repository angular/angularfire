import { storage } from 'firebase/app';
import { createPut } from './put';
import { Observable } from 'rxjs/Observable';
import { from } from 'rxjs/observable/from';
import { getDownloadURL, getMetadata } from './observable/fromRef';

/**
 * Create an AngularFire wrapped Storage Reference. This object
 * creates observable methods from promise based methods.
 * @param ref 
 */
export function createStorageRef(ref: storage.Reference) {
  return {
    getDownloadURL() { return getDownloadURL(ref); },
    getMetadata() { return getMetadata(ref); },
    put(data: any, metadata?: storage.UploadMetadata) {
      return createPut(ref)(data, metadata);
    }
  }
}
