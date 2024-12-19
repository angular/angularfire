import { Injector } from '@angular/core';
import { pendingUntilEvent } from '@angular/core/rxjs-interop';
import { observeOutsideAngular } from '@angular/fire';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ListOptions, ListResult, Reference, SettableMetadata, StringFormat, UploadMetadata } from './interfaces';
import { AngularFireUploadTask, createUploadTask } from './task';

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
  ref: Reference,
  injector?: Injector
): AngularFireStorageReference {
  return {
    getDownloadURL: () => of(undefined).pipe(
      observeOutsideAngular,
      switchMap(() => ref.getDownloadURL()),
      pendingUntilEvent(injector)
    ),
    getMetadata: () => of(undefined).pipe(
      observeOutsideAngular,
      switchMap(() => ref.getMetadata()),
      pendingUntilEvent(injector)
    ),
    delete: () => from(ref.delete()),
    child: (path: string) => createStorageRef(ref.child(path), injector),
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
