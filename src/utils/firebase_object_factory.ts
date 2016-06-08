import {FirebaseObjectObservable} from './firebase_object_observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/mergeMap';
import * as Firebase from 'firebase';
import * as utils from './utils';
import {Query} from './query_observable';

export function FirebaseObjectFactory(absoluteUrlOrDbRef: string | Firebase, {preserveSnapshot, query}: FirebaseObjectFactoryOpts = {}): FirebaseObjectObservable<any> {
  let ref: Firebase;

  utils.checkForUrlOrFirebaseRef(absoluteUrlOrDbRef, {
    isUrl: () => ref = new Firebase(<string>absoluteUrlOrDbRef),
    isRef: () => ref = <Firebase>absoluteUrlOrDbRef
  });

  return new FirebaseObjectObservable((obs: Observer<any>) => {
    ref.on('value', (snapshot: FirebaseDataSnapshot) => {
      obs.next(preserveSnapshot ? snapshot : utils.unwrapMapFn(snapshot));
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });

    return () => ref.off();
  }, ref);
}

export interface FirebaseObjectFactoryOpts {
  preserveSnapshot?: boolean;
  query?: Query;
}
