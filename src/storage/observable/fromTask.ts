import { Observable } from 'rxjs';
import { UploadTask, UploadTaskSnapshot } from '../interfaces';

export function fromTask(task: UploadTask) {
  return new Observable<UploadTaskSnapshot>(subscriber => {
    const progress = (snap: UploadTaskSnapshot) => subscriber.next(snap);
    const error = e => subscriber.error(e);
    const complete = () => subscriber.complete();
    task.on('state_changed', progress, error, () => {
      progress(task.snapshot);
      complete();
    });
    return () => task.cancel();
  });
}
