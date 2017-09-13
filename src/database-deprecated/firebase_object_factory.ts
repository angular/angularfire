import { FirebaseObjectObservable } from './firebase_object_observable';
import { ZoneScheduler } from 'angularfire2';
import { Observer } from 'rxjs/Observer';
import { observeOn } from 'rxjs/operator/observeOn';
import * as firebase from 'firebase/app';
import 'firebase/database';
import * as utils from './utils';
import { FirebaseObjectFactoryOpts, DatabaseReference } from './interfaces';

export function FirebaseObjectFactory (
  ref: DatabaseReference,
  { preserveSnapshot }: FirebaseObjectFactoryOpts = {}): FirebaseObjectObservable<any> {

  const objectObservable = new FirebaseObjectObservable((obs: Observer<any>) => {
    let fn = ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
      obs.next(preserveSnapshot ? snapshot : utils.unwrapMapFn(snapshot))
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });

    return () => ref.off('value', fn);
  }, ref);

  // TODO: should be in the subscription zone instead
  return observeOn.call(objectObservable, new ZoneScheduler(Zone.current));
}
