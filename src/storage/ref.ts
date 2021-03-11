import { AngularFireUploadTask, createUploadTask } from './task';
import { from, Observable, of } from 'rxjs';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { observeOn, switchMap } from 'rxjs/operators';
import { ListResult,
  StorageReference,
  SettableMetadata,
  StringFormat,
  UploadMetadata,
  UploadResult,
  StorageService,
} from './interfaces';
import { 
  getDownloadURL,
  getMetadata,
  ref,
  deleteObject,
  updateMetadata,
  uploadBytesResumable as put,
  uploadString as putString,
  listAll,
} from 'firebase/storage';

export interface AngularFireStorageReference {
  getDownloadURL(): Observable<any>;
  getMetadata(): Observable<any>;
  delete(): Observable<any>;
  child(path: string): any;
  updateMetadata(meta: SettableMetadata): Observable<any>;
  put(data: any, metadata?: UploadMetadata | undefined): AngularFireUploadTask;
  // MARK: Breaking change
  // previous: putString(data: string, format?: string | undefined, metadata?: UploadMetadata | undefined): AngularFireUploadTask;
  putString(data: string, format?: string | undefined, metadata?: UploadMetadata | undefined): Observable<UploadResult>;
  listAll(): Observable<ListResult>;
}

/**
 * Create an AngularFire wrapped Storage Reference. This object
 * creates observable methods from promise based methods.
 */
export function createStorageRef(
  storage: StorageService,
  storageRef: StorageReference,
  schedulers: ɵAngularFireSchedulers,
  keepUnstableUntilFirst: <T>(obs$: Observable<T>) => Observable<T>
): AngularFireStorageReference {
  return {
    getDownloadURL: () => of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => getDownloadURL(storageRef)),
      keepUnstableUntilFirst
    ),
    getMetadata: () => of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => getMetadata(storageRef)),
      keepUnstableUntilFirst
    ),
    delete: () => from(deleteObject(storageRef)),
    child: (path: string) => createStorageRef(storage, ref(storage, path), schedulers, keepUnstableUntilFirst),
    updateMetadata: (meta: SettableMetadata) => from(updateMetadata(storageRef, meta)),
    put: (data: any, metadata?: UploadMetadata) => {
      const task = put(storageRef, data, metadata);
      return createUploadTask(task);
    },
    // MARK: Breaking change
    // previous: AngularFireStorageReference.putString(data: string, format?: string, metadata?: UploadMetadata): AngularFireUploadTask
    putString: (data: string, format?: StringFormat, metadata?: UploadMetadata): Observable<UploadResult> => {
      const task = putString(storageRef, data, format, metadata);
      return from(task);
    },
    listAll: () => from(listAll(storageRef))
  };
}
