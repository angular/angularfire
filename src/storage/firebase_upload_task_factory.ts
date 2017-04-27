import { FirebaseUploadTaskObservable } from './firebase_upload_task_observable';
import { Observer } from 'rxjs/Observer';
import { observeOn } from 'rxjs/operator/observeOn';
import * as firebase from 'firebase/app';
import 'firebase/storage';
import * as utils from '../utils';
import { UploadTask, UploadTaskSnapshot } from '../interfaces';

export function FirebaseUploadTaskFactory (uploadTask: UploadTask): FirebaseUploadTaskObservable<UploadTaskSnapshot> {

  const objectObservable = new FirebaseUploadTaskObservable((obs: Observer<UploadTaskSnapshot>) => {
    uploadTask.on('state_changed', snapshot => {
        obs.next(snapshot);
    });
    uploadTask.then(snapshot => {
        obs.next(snapshot);
        obs.complete();
    }).catch(error => {
        obs.error(error.toString());
        obs.complete();
    });
  }, uploadTask);

  // TODO: should be in the subscription zone instead
  return observeOn.call(objectObservable, new utils.ZoneScheduler(Zone.current));
}
