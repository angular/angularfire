import { ListOptions, ListResult, Reference, SettableMetadata, StringFormat, UploadMetadata } from './interfaces';
import { AngularFireUploadTask, createUploadTask } from './task';
import { from, Observable, of } from 'rxjs';
import { observeOutsideAngular, keepUnstableUntilFirst } from '@angular/fire';
import { switchMap } from 'rxjs/operators';

export interface AngularFireStorageReference {
  getDownloadURL(): Observable<any>;
  getMetadata(): Observable<any>;
  delete(): Observable<any>;
  child(path: string): AngularFireStorageReference;
  updateMetadata(meta: SettableMetadata): Observable<any>;
  put(data: any, metadata?: UploadMetadata | undefined): AngularFireUploadTask;
  putString(data: string, format?: string | undefined, metadata?: UploadMetadata | undefined): AngularFireUploadTask;
  list(options?: ListOptions): Observable<ListResult>;
  listAll(): Observable<ListResult>;
}

/**
 * Create an AngularFire wrapped Storage Reference. This object
 * creates observable methods from promise based methods.
 */
export function createStorageRef(
  ref: Reference
): AngularFireStorageReference {
  return {
    getDownloadURL: () => of(undefined).pipe(
      observeOutsideAngular,
      switchMap(() => ref.getDownloadURL()),
      keepUnstableUntilFirst
    ),
    getMetadata: () => of(undefined).pipe(
      observeOutsideAngular,
      switchMap(() => ref.getMetadata()),
      keepUnstableUntilFirst
    ),
    delete: () => from(ref.delete()),
    child: (path: string) => createStorageRef(ref.child(path)),
    updateMetadata: (meta: SettableMetadata) => from(ref.updateMetadata(meta)),
    put: (data: any, metadata?: UploadMetadata) => {
      const task = ref.put(data, metadata);
      return createUploadTask(task);
    },
    putString: (data: string, format?: StringFormat, metadata?: UploadMetadata) => {
      const task = ref.putString(data, format, metadata);
      return createUploadTask(task);
    },
    list: (options?: ListOptions) => from(ref.list(options)),
    listAll: () => from(ref.listAll())
  };
}
