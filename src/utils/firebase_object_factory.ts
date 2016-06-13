import {FirebaseObjectObservable} from './firebase_object_observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/mergeMap';
import { database } from 'firebase';
import * as utils from './utils';
import {Query, observeQuery} from './query_observable';

export function FirebaseObjectFactory(absoluteUrlOrDbRef: string | firebase.database.Reference, {preserveSnapshot, query}: FirebaseObjectFactoryOpts = {}): FirebaseObjectObservable<any> {
  let ref: firebase.database.Reference;

  utils.checkForUrlOrFirebaseRef(absoluteUrlOrDbRef, {
    isUrl: () => ref = database().refFromURL(<string>absoluteUrlOrDbRef),
    isRef: () => ref = <firebase.database.Reference>absoluteUrlOrDbRef
  });

  return new FirebaseObjectObservable((obs: Observer<any>) => {
    ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
      obs.next(preserveSnapshot ? snapshot : utils.unwrapMapFn(snapshot))
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });

    return () => ref.off();
  }, ref);
}

export interface FirebaseObjectFactoryOpts {
  preserveSnapshot?: boolean;
  query?: Query
}
