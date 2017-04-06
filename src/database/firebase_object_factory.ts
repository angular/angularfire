import { FirebaseObjectObservable } from './index';
import { Observer } from 'rxjs/Observer';
import { observeOn } from 'rxjs/operator/observeOn';
import * as firebase from 'firebase/app';
import 'firebase/database';
import { isAbsoluteUrl, ZoneScheduler } from '../utils';
import { checkForUrlOrFirebaseRef } from './utils';
import { unwrapSnapshot as defaultUnwrapSnapshot } from './unwrap_snapshot';
import { FirebaseObjectFactoryOpts, PathReference, DatabaseReference } from './interfaces';

export function FirebaseObjectFactory (
  pathRef: PathReference,
  { preserveSnapshot, unwrapSnapshot }: FirebaseObjectFactoryOpts = {}): FirebaseObjectObservable<any> {

  if (unwrapSnapshot && preserveSnapshot) {
    throw new Error('Cannot use preserveSnapshot with unwrapSnapshot.');
  }
  if (!unwrapSnapshot) {
    unwrapSnapshot = defaultUnwrapSnapshot;
  }

  let ref: DatabaseReference;

  checkForUrlOrFirebaseRef(pathRef, {
    isUrl: () => {
      const path = pathRef as string;
      if(isAbsoluteUrl(path)) {
        ref = firebase.database().refFromURL(path)
      } else {
        ref = firebase.database().ref(path);
      }
    },
    isRef: () => ref = <DatabaseReference>pathRef
  });

  const objectObservable = new FirebaseObjectObservable((obs: Observer<any>) => {
    let fn = ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
      obs.next(preserveSnapshot ? snapshot : unwrapSnapshot(snapshot))
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });

    return () => ref.off('value', fn);
  }, ref);

  // TODO: should be in the subscription zone instead
  return observeOn.call(objectObservable, new ZoneScheduler(Zone.current));
}
