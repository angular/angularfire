import { storage } from 'firebase/app';
import { fromTask } from './observable/fromTask';
import { Observable } from 'rxjs/Observable';

export function createUploadTask(task: storage.UploadTask) {
  return {
    snapshotChanges() { return fromTask(task); },    
    pause() { return task.pause(); },    
    cancel() { return task.cancel(); },    
    resume() { return task.resume(); },    
    then() { return task.then(); },    
    catch(onRejected: (a: Error) => any) { 
      return task.catch(onRejected);
    } 
  };
}
