import { SettableMetadata, UploadMetadata, Reference, StringFormat } from '@firebase/storage-types';
import { createUploadTask, AngularFireUploadTask } from './task';
import { Observable } from 'rxjs/Observable';
import { from } from 'rxjs/observable/from';

export interface AngularFireStorageReference {
  getDownloadURL(): Observable<any>;
  getMetadata(): Observable<any>;
  delete(): Observable<any>;
  child(path: string): any;
  updateMetatdata(meta: SettableMetadata): Observable<any>;
  put(data: any, metadata?: UploadMetadata | undefined): AngularFireUploadTask;
  putString(data: string, format?: string | undefined, metadata?: UploadMetadata | undefined): AngularFireUploadTask;
}

/**
 * Create an AngularFire wrapped Storage Reference. This object
 * creates observable methods from promise based methods.
 * @param ref
 */
export function createStorageRef(ref: Reference): AngularFireStorageReference {
  return {
    getDownloadURL() { return from(ref.getDownloadURL()); },
    getMetadata() { return from(ref.getMetadata()) },
    delete() { return from(ref.delete()); },
    child(path: string) { return createStorageRef(ref.child(path)); },
    updateMetatdata(meta: SettableMetadata) {
      return from(ref.updateMetadata(meta));
    },
    put(data: any, metadata?: UploadMetadata) {
      const task = ref.put(data, metadata);
      return createUploadTask(task);
    },
    putString(data: string, format?: StringFormat, metadata?: UploadMetadata) {
      const task = ref.putString(data, format, metadata);
      return createUploadTask(task);
    }
  }
}
