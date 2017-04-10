import { FirebaseObjectObservable } from './index';
import { Observer } from 'rxjs/Observer';
import { observeOn } from 'rxjs/operator/observeOn';
import * as firebase from 'firebase/app';
import 'firebase/database';
import * as utils from '../utils';
import { FirebaseObjectFactoryOpts, PathReference, DatabaseReference } from '../interfaces';

export function FirebaseObjectFactory (
  pathRef: PathReference,
  { preserveSnapshot }: FirebaseObjectFactoryOpts = {}): FirebaseObjectObservable<any> {

  let ref: DatabaseReference;

  utils.checkForUrlOrFirebaseRef(pathRef, {
    isUrl: () => {
      const path = pathRef as string;
      if(utils.isAbsoluteUrl(path)) {
        ref = firebase.database().refFromURL(path)
      } else {
        ref = firebase.database().ref(path);
      }      
    },
    isRef: () => ref = <DatabaseReference>pathRef
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
