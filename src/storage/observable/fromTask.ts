import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { UploadTask, UploadTaskSnapshot } from '../interfaces';

export function fromTask(task: UploadTask) {
  return new Observable<UploadTaskSnapshot>(subscriber => {
    const progress = (snap: UploadTaskSnapshot) => subscriber.next(snap);
    const error = e => subscriber.error(e);
    const complete = () => subscriber.complete();
    task.on('state_changed', progress, (e) => {
      progress(task.snapshot);
      error(e);
    }, () => {
      progress(task.snapshot);
      complete();
    });
  }).pipe(
    shareReplay({ bufferSize: 1, refCount: false })
  );
}
