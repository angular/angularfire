import { storage } from 'firebase/app';
import { fromTask } from './observable/fromTask';
import { Observable } from 'rxjs/Observable';

export class AngularFireUploadTask {
  constructor(public task: storage.UploadTask) {}

  snapshotChanges() { return fromTask(this.task); }

  pause() { return this.task.pause(); }

  cancel() { return this.task.cancel(); }

  resume() { return this.task.resume(); }

  then() { return this.task.then(); }

  catch(onRejected: (a: Error) => any) { return this.task.catch(onRejected); } 
}
