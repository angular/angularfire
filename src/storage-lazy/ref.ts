import { ListResult, Reference, SettableMetadata, StringFormat, UploadMetadata } from './interfaces';
import { AngularFireUploadTask, createUploadTask } from './task';
import { from, Observable, of } from 'rxjs';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { map, observeOn, switchMap } from 'rxjs/operators';

export interface AngularFireStorageReference {
  getDownloadURL(): Observable<any>;
  getMetadata(): Observable<any>;
  delete(): Observable<any>;
  child(path: string): AngularFireStorageReference;
  updateMetadata(meta: SettableMetadata): Observable<any>;
  put(data: any, metadata?: UploadMetadata | undefined): AngularFireUploadTask;
  putString(data: string, format?: string | undefined, metadata?: UploadMetadata | undefined): AngularFireUploadTask;
  listAll(): Observable<ListResult>;
}

/**
 * Create an AngularFire wrapped Storage Reference. This object
 * creates observable methods from promise based methods.
 */
export function createStorageRef(
  ref$: Observable<Reference>,
  schedulers: ɵAngularFireSchedulers,
  keepUnstableUntilFirst: <T>(obs$: Observable<T>) => Observable<T>
): AngularFireStorageReference {
  return {
    getDownloadURL: () => ref$.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(ref => ref.getDownloadURL()),
      keepUnstableUntilFirst
    ),
    getMetadata: () => ref$.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(ref => ref.getMetadata()),
      keepUnstableUntilFirst
    ),
    delete: () => ref$.pipe(switchMap(ref => ref.delete())),
    child: (path: string) => createStorageRef(ref$.pipe(map(ref => ref.child(path))), schedulers, keepUnstableUntilFirst),
    updateMetadata: (meta: SettableMetadata) => ref$.pipe(switchMap(ref => ref.updateMetadata(meta))),
    put: (data: any, metadata?: UploadMetadata) => {
      const task = ref$.pipe(map(ref => ref.put(data, metadata)));
      return createUploadTask(task);
    },
    putString: (data: string, format?: StringFormat, metadata?: UploadMetadata) => {
      const task = ref$.pipe(map(ref => ref.putString(data, format, metadata)));
      return createUploadTask(task);
    },
    listAll: () => ref$.pipe(switchMap(ref => ref.listAll()))
  };
}
