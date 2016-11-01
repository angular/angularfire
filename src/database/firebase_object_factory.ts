import { FirebaseObjectObservable } from './index';
import { Observer } from 'rxjs/Observer';
import { observeOn } from 'rxjs/operator/observeOn';
import * as firebase from 'firebase';
import * as utils from '../utils';
import { Query } from '../interfaces';
import { observeQuery } from './query_observable';
import { FirebaseObjectFactoryOpts } from '../interfaces';

export function FirebaseObjectFactory (
  absoluteUrlOrDbRef: string | firebase.database.Reference,
  { preserveSnapshot, query }: FirebaseObjectFactoryOpts = {}): FirebaseObjectObservable<any> {

  let ref: firebase.database.Reference;

  utils.checkForUrlOrFirebaseRef(absoluteUrlOrDbRef, {
    isUrl: () => ref = firebase.database().refFromURL(<string>absoluteUrlOrDbRef),
    isRef: () => ref = <firebase.database.Reference>absoluteUrlOrDbRef
  });

  const objectObservable = new FirebaseObjectObservable((obs: Observer<any>) => {
    let fn = ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
      obs.next(preserveSnapshot ? snapshot : utils.unwrapMapFn(snapshot))
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });

    return () => ref.off('value', fn);
  }, ref);

  return observeOn.call(objectObservable, new utils.ZoneScheduler(Zone.current));
}
