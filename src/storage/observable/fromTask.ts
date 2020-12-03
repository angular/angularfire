import { Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { UploadTask, UploadTaskSnapshot } from '../interfaces';

// need to import, else the types become import('firebase/app').default.storage.UploadTask
// and it no longer works w/Firebase v7
import firebase from 'firebase/app';

export function fromTask(task: UploadTask) {
  return new Observable<UploadTaskSnapshot>(subscriber => {
    const progress = (snap: UploadTaskSnapshot) => subscriber.next(snap);
    const error = e => subscriber.error(e);
    const complete = () => subscriber.complete();
    // emit the current snapshot, so they don't have to wait for state_changes
    // to fire next
    progress(task.snapshot);
    const unsub = task.on('state_changed', progress);
    // it turns out that neither task snapshot nor 'state_changed' fire the last
    // snapshot before completion, the one with status 'success" and 100% progress
    // so let's use the promise form of the task for that
    task.then(snapshot => {
      progress(snapshot);
      complete();
    }, error);
    // on's type if Function, rather than () => void, need to wrap
    return function unsubscribe() {
      unsub();
    };
  }).pipe(
    // deal with sync emissions from first emitting `task.snapshot`, this makes sure
    // that if the task is already finished we don't emit the old running state
    debounceTime(0)
  );
}
