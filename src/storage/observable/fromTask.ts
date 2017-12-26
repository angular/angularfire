import { UploadTask, UploadTaskSnapshot } from '@firebase/storage-types';
import { Observable } from 'rxjs/Observable';

export function fromTask(task: UploadTask) {
  return new Observable<UploadTaskSnapshot | undefined>(subscriber => {
    const progress = (snap: UploadTaskSnapshot) => subscriber.next(snap);
    const error = e => subscriber.error(e);
    const complete = () => subscriber.complete();
    task.on('state_changed', progress, error, complete);
    return () => task.cancel();
  });
}
