import { NgZone } from '@angular/core';
import { FirebaseObjectObservable } from './firebase_object_observable';
import { FirebaseZoneScheduler } from 'angularfire2';
import { Observer } from 'rxjs';
import { observeOn } from 'rxjs/operators';
import * as utils from './utils';
import { DataSnapshot, FirebaseObjectFactoryOpts, DatabaseReference } from './interfaces';

export function FirebaseObjectFactory (
  ref: DatabaseReference,
  { preserveSnapshot }: FirebaseObjectFactoryOpts = {}): FirebaseObjectObservable<any> {

  const objectObservable = new FirebaseObjectObservable((obs: Observer<any>) => {
    let fn = ref.on('value', (snapshot: DataSnapshot) => {
      obs.next(preserveSnapshot ? snapshot : utils.unwrapMapFn(snapshot))
    }, err => {
      if (err) { obs.error(err); obs.complete(); }
    });

    return () => ref.off('value', fn);
  }, ref);

  // TODO: should be in the subscription zone instead
  return observeOn.call(objectObservable, new FirebaseZoneScheduler(new NgZone({}), {}));
}
