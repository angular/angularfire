import { SettableMetadata, UploadMetadata, Reference, StringFormat } from '@firebase/storage-types';
import { createUploadTask, AngularFireUploadTask } from './task';
import { Observable } from 'rxjs/Observable';
import { from } from 'rxjs/observable/from';
import { NgZone } from '@angular/core';
import { observeOn } from 'rxjs/operator/observeOn';
import { FirebaseZoneScheduler } from 'angularfire2';

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
    getDownloadURL: () => from(ref.getDownloadURL()),
    getMetadata: () => from(ref.getMetadata()),
    delete: () => from(ref.delete()),
    child: (path: string) => createStorageRef(ref.child(path)),
    updateMetatdata: (meta: SettableMetadata) => from(ref.updateMetadata(meta)),
    put: (data: any, metadata?: UploadMetadata) => {
      const zone = new NgZone({});
      return zone.runOutsideAngular(() => {
        const task = ref.put(data, metadata);
        const obs$ = createUploadTask(task);
        return observeOn.call(obs$, new FirebaseZoneScheduler(zone));
      });
    },
    putString: (data: string, format?: StringFormat, metadata?: UploadMetadata) => {
      const zone = new NgZone({});
      return zone.runOutsideAngular(() => {
        const task = ref.putString(data, format, metadata);
        const obs$ = createUploadTask(task);
        return observeOn.call(obs$, new FirebaseZoneScheduler(zone));
      });
    }
  };
}
