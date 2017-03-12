import { FirebaseObjectObservable } from './index';
import { Observer } from 'rxjs/Observer';
import { observeOn } from 'rxjs/operator/observeOn';
import * as firebase from 'firebase/app';
import 'firebase/database';
import * as utils from '../utils';
import { FirebaseObjectFactoryOpts, PathReference } from '../interfaces';

export function FirebaseObjectFactory (
  pathReference: PathReference,
  { preserveSnapshot }: FirebaseObjectFactoryOpts = {}): FirebaseObjectObservable<any> {

  let ref: firebase.database.Reference;

  utils.checkForUrlOrFirebaseRef(pathReference, {
    isUrl: () => ref = firebase.database().ref(<string>pathReference),
    isRef: () => ref = <firebase.database.Reference>pathReference
  });

  const objectObservable = new FirebaseObjectObservable((obs: Observer<any>) => {
    let fn = ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
      obs.next(preserveSnapshot ? snapshot : utils.unwrapMapFn(snapshot))
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });

    return () => ref.off('value', fn);
  }, ref);

  // TODO: should be in the subscription zone instead
  return observeOn.call(objectObservable, new utils.ZoneScheduler(Zone.current));
}
