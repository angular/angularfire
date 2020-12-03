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
    const unsub = task.on('state_changed', progress);
    task.then(snapshot => {
      progress(snapshot);
      complete();
    }, error);
    // on's type if Function, rather than () => void, need to wrap
    return function unsubscribe() {
      unsub();
    };
  });
}
