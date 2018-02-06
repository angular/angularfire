import { UploadTaskSnapshot, UploadTask } from '@firebase/storage-types';
import { fromTask } from './observable/fromTask';
import { Observable } from 'rxjs/Observable';
import { map, filter } from 'rxjs/operators';
import { from } from 'rxjs/observable/from';
import { NgZone } from '@angular/core';
import { observeOn } from 'rxjs/operator/observeOn';
import { FirebaseZoneScheduler } from 'angularfire2';

export interface AngularFireUploadTask {
  task: UploadTask,
  snapshotChanges(): Observable<UploadTaskSnapshot | undefined>;
  percentageChanges(): Observable<number | undefined>;
  downloadURL(): Observable<string | null>;
  pause(): boolean;
  cancel(): boolean;
  resume(): boolean;
  then(
    onFulfilled?: ((a: UploadTaskSnapshot) => any) | null, 
    onRejected?: ((a: Error) => any) | null
  ): Promise<any>;
  catch(onRejected: (a: Error) => any): Promise<any>;
}

/**
 * Create an AngularFireUploadTask from a regular UploadTask from the Storage SDK.
 * This method creates an observable of the upload and returns on object that provides
 * multiple methods for controlling and monitoring the file upload.
 * @param task 
 */
export function createUploadTask(task: UploadTask): AngularFireUploadTask {
  const zone = new NgZone({});
  const inner$ = zone.runOutsideAngular(() =>
    observeOn.call(fromTask(task), new FirebaseZoneScheduler(zone))
  ) as Observable<UploadTaskSnapshot>;
  return {
    task: task,
    then: task.then.bind(task),
    catch: task.catch.bind(task),
    pause: task.pause.bind(task),
    cancel: task.cancel.bind(task),
    resume: task.resume.bind(task),
    snapshotChanges: () => inner$,
    downloadURL: () => from(task.then(s => s.downloadURL)),
    percentageChanges: () => inner$.pipe(
      map(s => s.bytesTransferred / s.totalBytes * 100)
    )
  };
}
