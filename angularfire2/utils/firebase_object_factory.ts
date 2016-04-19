import {FirebaseObjectObservable} from './firebase_object_observable';
import {Observer} from 'rxjs/Observer';
import * as Firebase from 'firebase';
import * as utils from './utils';

export function FirebaseObjectFactory (absoluteUrlOrDbRef:string | Firebase | FirebaseQuery, {preserveSnapshot}:FirebaseObjectFactoryOpts = {}): FirebaseObjectObservable<any> {
  let ref: Firebase;
  utils.checkForUrlOrFirebaseRef(absoluteUrlOrDbRef, {
    isUrl: () => ref = new Firebase(<string>absoluteUrlOrDbRef),
    isRef: () => ref = <Firebase>absoluteUrlOrDbRef
  });
  
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
