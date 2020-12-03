import { Observable } from 'rxjs';
import { UploadTask, UploadTaskSnapshot } from '../interfaces';

// need to import, else the types become import('firebase/app').default.storage.UploadTask
// and it no longer works w/Firebase v7
import firebase from 'firebase/app';

export function fromTask(task: UploadTask) {
  return new Observable<UploadTaskSnapshot>(subscriber => {
    const progress = (snap: UploadTaskSnapshot) => subscriber.next(snap);
    const error = e => subscriber.error(e);
    const complete = () => subscriber.complete();
    progress(task.snapshot);
    switch (task.snapshot.state) {
      case firebase.storage.TaskState.SUCCESS:
      case firebase.storage.TaskState.CANCELED:
        complete();
        break;
      case firebase.storage.TaskState.ERROR:
        error(new Error('task was already in error state'));
        break;
      default:
        // on's type if Function, rather than () => void, need to wrap
        const unsub = task.on('state_changed', progress, (e) => {
          progress(task.snapshot);
          error(e);
        }, () => {
          progress(task.snapshot);
          complete();
        });
        return function unsubscribe() {
          unsub();
        };
    }
  });
}
