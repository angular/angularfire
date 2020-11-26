import { UploadTask, UploadTaskSnapshot } from './interfaces';
import { fromTask } from './observable/fromTask';
import { Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';

export interface AngularFireUploadTask {
  snapshot: Observable<UploadTaskSnapshot | undefined>;
  progress: Observable<number | undefined>;
  pause(): Promise<boolean>;
  cancel(): Promise<boolean>;
  resume(): Promise<boolean>;
}

/**
 * Create an AngularFireUploadTask from a regular UploadTask from the Storage SDK.
 * This method creates an observable of the upload and returns on object that provides
 * multiple methods for controlling and monitoring the file upload.
 */
export function createUploadTask(task: Observable<UploadTask>): AngularFireUploadTask {
  const task$ = task.pipe(shareReplay({ refCount: false, bufferSize: 1 }));
  const snapshot = task.pipe(switchMap(fromTask));
  return {
    pause: () => task$.toPromise().then(it => it.pause()),
    cancel: () => task$.toPromise().then(it => it.cancel()),
    resume: () => task$.toPromise().then(it => it.resume()),
    snapshot,
    progress: snapshot.pipe(
      map(s => s.bytesTransferred / s.totalBytes * 100)
    )
  };
}
