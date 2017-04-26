import { FirebaseUploadTaskObservable } from './firebase_upload_task_observable';
import { Observer } from 'rxjs/Observer';
import { observeOn } from 'rxjs/operator/observeOn';
import * as firebase from 'firebase/app';
import 'firebase/storage';
import * as utils from '../utils';
import { UploadTask, UploadTaskState } from '../interfaces';

export function FirebaseUploadTaskFactory (uploadTask: UploadTask): FirebaseUploadTaskObservable<any> {

  const objectObservable = new FirebaseUploadTaskObservable((obs: Observer<UploadTaskState>) => {
    let state: any = undefined;
    let snapshot: any = undefined;
    uploadTask.then(_snapshot => {
        snapshot = _snapshot;
        obs.next({state, snapshot});
    });
    let fn = uploadTask.on('STATE_CHANGE', _state => {
        state = _state;
        obs.next({state, snapshot})
    }, err => {
        obs.error(err);
        obs.complete();
    }, () => {
        obs.complete();
    });
  }, uploadTask);

  // TODO: should be in the subscription zone instead
  return observeOn.call(objectObservable, new utils.ZoneScheduler(Zone.current));
}
