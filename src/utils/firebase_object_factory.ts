import {FirebaseObjectObservable} from './firebase_object_observable';
import {Observer} from 'rxjs/Observer';
import * as Firebase from 'firebase';

export function FirebaseObjectFactory (absoluteUrl:string, {preserveSnapshot}:FirebaseObjectFactoryOpts = {}): FirebaseObjectObservable<any> {
  var ref = new Firebase(absoluteUrl);
  return new FirebaseObjectObservable((obs:Observer<any[]>) => {
    ref.on('value', (snapshot) => {
      obs.next(preserveSnapshot ? snapshot : snapshot.val())
    });

    return () => ref.off();
  }, ref);
}

export interface FirebaseObjectFactoryOpts {
  preserveSnapshot?: boolean;
}
