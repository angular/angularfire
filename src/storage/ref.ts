import { SettableMetadata, UploadMetadata, Reference, StringFormat } from './interfaces';
import { createUploadTask, AngularFireUploadTask } from './task';
import { Observable, from, of } from 'rxjs';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { observeOn, switchMap } from 'rxjs/operators';

export interface AngularFireStorageReference {
  getDownloadURL(): Observable<any>;
  getMetadata(): Observable<any>;
  delete(): Observable<any>;
  child(path: string): any;
  updateMetatdata(meta: SettableMetadata): Observable<any>;
  updateMetadata(meta: SettableMetadata): Observable<any>;
  put(data: any, metadata?: UploadMetadata | undefined): AngularFireUploadTask;
  putString(data: string, format?: string | undefined, metadata?: UploadMetadata | undefined): AngularFireUploadTask;
}

/**
 * Create an AngularFire wrapped Storage Reference. This object
 * creates observable methods from promise based methods.
 * @param ref
 */
export function createStorageRef(
  ref: Reference,
  schedulers: ɵAngularFireSchedulers,
  keepUnstableUntilFirst: <T>(obs$: Observable<T>) => Observable<T>
): AngularFireStorageReference {
  return {
    getDownloadURL: () => of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => ref.getDownloadURL()),
      keepUnstableUntilFirst
    ),
    getMetadata: () => of().pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => ref.getMetadata()),
      keepUnstableUntilFirst
    ),
    delete: () => from(ref.delete()),
    child: (path: string) => createStorageRef(ref.child(path), schedulers, keepUnstableUntilFirst),
    updateMetatdata: (meta: SettableMetadata) => from(ref.updateMetadata(meta)),
    updateMetadata: (meta: SettableMetadata) => from(ref.updateMetadata(meta)),
    put: (data: any, metadata?: UploadMetadata) => {
      const task = ref.put(data, metadata);
      return createUploadTask(task);
    },
    putString: (data: string, format?: StringFormat, metadata?: UploadMetadata) => {
      const task = ref.putString(data, format, metadata);
      return createUploadTask(task);
    }
  };
}
