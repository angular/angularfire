import { storage } from 'firebase/app';
import 'firebase/storage';
import { Observable } from 'rxjs/Observable';

export function fromTask(task: storage.UploadTask) {
  return new Observable<storage.UploadTaskSnapshot | undefined>(subscriber => {
    task.on('state_changed', 
      (snap: storage.UploadTaskSnapshot) => subscriber.next(snap),
      e => subscriber.error(e),
      () => subscriber.complete()
    );
    return { unsubscribe: task.cancel };
  });
}
