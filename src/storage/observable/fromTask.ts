import { storage } from 'firebase/app';
import { Observable } from 'rxjs/Observable';

export function fromTask(task: storage.UploadTask) {
  return new Observable<storage.UploadTaskSnapshot | undefined>(subscriber => {
    const progress = (snap: storage.UploadTaskSnapshot) => subscriber.next(snap);
    const error = e => subscriber.error(e);
    const complete = () => subscriber.complete();
    task.on('state_changed', progress, error, complete);
    return () => task.cancel();
  });
}
