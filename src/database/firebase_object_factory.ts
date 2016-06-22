import { FirebaseObjectObservable } from './index';
import { Observer } from 'rxjs/Observer';
import { database } from 'firebase';
import * as utils from '../utils/utils';
import { Query } from '../interfaces';
import { observeQuery } from './query_observable';
import { FirebaseObjectFactoryOpts } from '../interfaces';
import 'rxjs/add/operator/mergeMap';

export function FirebaseObjectFactory (
  absoluteUrlOrDbRef: string | firebase.database.Reference, 
  { preserveSnapshot, query }: FirebaseObjectFactoryOpts = {}): FirebaseObjectObservable<any> {
  
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