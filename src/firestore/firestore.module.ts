import { NgModule, Optional, NgZone, InjectionToken } from '@angular/core';
import { FirebaseFirestore } from 'firebase/firestore';

import { ɵsmartCacheInstance, ɵfetchCachedInstance } from '../core';
import { Firestore } from './firestore';
import { DEFAULT_APP_NAME, FIREBASE_APPS } from '../app/app.module';
import { AUTH_INSTANCES } from '../auth/auth.module';
import { ɵAngularFireSchedulers } from '../zones';

export const FIRESTORE_INSTANCES = new InjectionToken<Firestore[]>('angularfire2.firestore-instances');

const CACHE_PREFIX = 'Firestore';

export function ɵdefaultFirestoreInstanceFactory(_: Firestore[]) {
  const firestore = ɵfetchCachedInstance([CACHE_PREFIX, DEFAULT_APP_NAME].join('.'));
  if (firestore) {
    return new Firestore(firestore);
  }
  throw new Error(`No FireaseFirestore Instance provided for the '${DEFAULT_APP_NAME}' Firebase App - call provideFirestore(...) in your providers list.`);
}

export function ɵwrapFirestoreInstanceInInjectable(firestore: FirebaseFirestore) {
  return new Firestore(firestore);
}

export function ɵfirestoreInstancesFactory(instances: Firestore[]) {
  return instances;
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundFirestoreInstanceFactory(zone: NgZone) {
  const firestore = ɵsmartCacheInstance<FirebaseFirestore>(CACHE_PREFIX, this, zone);
  return new Firestore(firestore);
}

const DEFAULT_FIRESTORE_INSTANCE_PROVIDER = {
  provide: Firestore,
  useFactory: ɵdefaultFirestoreInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), FIRESTORE_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_FIRESTORE_INSTANCE_PROVIDER,
  ]
})
export class FirestoreModule {
}

export function provideFirestore(fn: () => FirebaseFirestore) {
  return {
    ngModule: FirestoreModule,
    providers: [{
      provide: FIRESTORE_INSTANCES,
      useFactory: ɵboundFirestoreInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), FIREBASE_APPS ],
        // Firestore+Auth work better if Auth is loaded first
        [new Optional(), AUTH_INSTANCES ],
      ]
    }]
  };
}
