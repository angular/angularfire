import { storage } from 'firebase/app';
import 'firebase/storage';
import { Observable } from 'rxjs/Observable';

export function fromTask(task: storage.UploadTask) {
  return new Observable<storage.UploadTaskSnapshot>(subscriber => {
    task.on('state_changed', subscriber);
    return { unsubscribe: task.cancel };
  });
}
