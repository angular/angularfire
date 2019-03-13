import { SettableMetadata, UploadMetadata, Reference, StringFormat } from './interfaces';
import { createUploadTask, AngularFireUploadTask } from './task';
import { Observable, from } from 'rxjs';
import { FirebaseZoneScheduler } from '@angular/fire';

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
export function createStorageRef(ref: Reference, scheduler: FirebaseZoneScheduler): AngularFireStorageReference {
  return {
    getDownloadURL: () => scheduler.keepUnstableUntilFirst(
      scheduler.runOutsideAngular(
        from(scheduler.zone.runOutsideAngular(() => ref.getDownloadURL()))
      )
    ),
    getMetadata: () => scheduler.keepUnstableUntilFirst(
      scheduler.runOutsideAngular(
        from(scheduler.zone.runOutsideAngular(() => ref.getMetadata()))
      )
    ),
    delete: () => from(ref.delete()),
    child: (path: string) => createStorageRef(ref.child(path), scheduler),
    updateMetatdata: (meta: SettableMetadata) => from(ref.updateMetadata(meta)),
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
