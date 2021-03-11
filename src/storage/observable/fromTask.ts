import { Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { UploadTask, UploadTaskSnapshot } from '../interfaces';

// Things aren't working great, I'm having to put in a lot of work-arounds for what
// appear to be Firebase JS SDK bugs https://github.com/firebase/firebase-js-sdk/issues/4158
export function fromTask(task: UploadTask) {
  return new Observable<UploadTaskSnapshot>(subscriber => {
    const progress = (snap: UploadTaskSnapshot) => subscriber.next(snap);
    const error = e => subscriber.error(e);
    const complete = () => subscriber.complete();
    // emit the current snapshot, so they don't have to wait for state_changes
    // to fire next... this is stale if the task is no longer running :(
    progress(task.snapshot);
    const unsub = task.on('state_changed', progress);
    // it turns out that neither task snapshot nor 'state_changed' fire the last
    // snapshot before completion, the one with status 'success" and 100% progress
    // so let's use the promise form of the task for that
    task.then(snapshot => {
      progress(snapshot);
      complete();
    }, e => {
      // TODO investigate, again this is stale, we never fire a canceled or error it seems
      progress(task.snapshot);
      error(e);
    });
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
