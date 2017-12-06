import { storage } from 'firebase/app';
import { fromTask } from './observable/fromTask';
import { Observable } from 'rxjs/Observable';
import { map, filter, shareReplay } from 'rxjs/operators';

export interface AngularFireUploadTask {
  snapshotChanges(): Observable<storage.UploadTaskSnapshot | undefined>;
  percentageChanges(): Observable<number | undefined>;
  downloadURL(): Observable<string | null>;
  pause(): boolean;
  cancel(): boolean;
  resume(): boolean;
  then(): Promise<any>;
  catch(onRejected: (a: Error) => any): Promise<any>;
}

export function createUploadTask(task: storage.UploadTask): AngularFireUploadTask {
  const inner$ = fromTask(task).pipe(shareReplay());
  return { 
    pause() { return task.pause(); },    
    cancel() { return task.cancel(); },    
    resume() { return task.resume(); },    
    then() { return task.then(); },    
    catch(onRejected: (a: Error) => any) { 
      return task.catch(onRejected);
    },
    snapshotChanges() { return inner$; },   
    percentageChanges() { 
      return inner$.pipe(
        filter(s => s !== undefined),
        map(s => s!.bytesTransferred / s!.totalBytes * 100)
      );
    },
    downloadURL() {
      return inner$.pipe(
        filter(s => s !== undefined),
        filter(s => s!.bytesTransferred === s!.totalBytes),
        map(s => s!.downloadURL)
      );
    }
  };
}
