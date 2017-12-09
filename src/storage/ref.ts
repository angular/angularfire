import { storage } from 'firebase/app';
import { createUploadTask, AngularFireUploadTask } from './task';
import { Observable } from 'rxjs/Observable';
import { from } from 'rxjs/observable/from';

export interface AngularFireStorageReference {
  getDownloadURL(): Observable<any>;
  getMetadata(): Observable<any>;
  delete(): Observable<any>;
  child(path: string): any;
  updateMetatdata(meta: storage.SettableMetadata): Observable<any>;
  put(data: any, metadata?: storage.UploadMetadata | undefined): AngularFireUploadTask;
  putString(data: string, format?: string | undefined, metadata?: storage.UploadMetadata | undefined): AngularFireUploadTask;
}

/**
 * Create an AngularFire wrapped Storage Reference. This object
 * creates observable methods from promise based methods.
 * @param ref 
 */
export function createStorageRef(ref: storage.Reference): AngularFireStorageReference {
  return {
    getDownloadURL() { return from(ref.getDownloadURL()); },
    getMetadata() { return from(ref.getMetadata()) },
    delete() { return from(ref.delete()); },
    child(path: string) { return createStorageRef(ref.child(path)); },
    updateMetatdata(meta: storage.SettableMetadata) { 
      return from(ref.updateMetadata(meta)); 
    },
    put(data: any, metadata?: storage.UploadMetadata) {
      const task = ref.put(data, metadata);
      return createUploadTask(task);
    },
    putString(data: string, format?: storage.StringFormat, metadata?: storage.UploadMetadata) {
      const task = ref.putString(data, format, metadata);
      return createUploadTask(task);
    }
  }
}
