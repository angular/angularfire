import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UploadTask, UploadTaskSnapshot } from './interfaces';
import { fromTask } from './observable/fromTask';

export interface AngularFireUploadTask {
  task: UploadTask;
  snapshotChanges(): Observable<UploadTaskSnapshot | undefined>;
  percentageChanges(): Observable<number | undefined>;
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
 */
export function createUploadTask(task: UploadTask): AngularFireUploadTask {
  const inner$ = fromTask(task);
  return {
    task,
    then: task.then.bind(task),
    catch: task.catch.bind(task),
    pause: task.pause.bind(task),
    cancel: task.cancel.bind(task),
    resume: task.resume.bind(task),
    snapshotChanges: () => inner$,
    percentageChanges: () => inner$.pipe(
      map(s => s.bytesTransferred / s.totalBytes * 100)
    )
  };
}
