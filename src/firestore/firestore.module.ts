import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { FirebaseFirestore } from 'firebase/firestore';

import { ɵmemoizeInstance, ɵgetDefaultInstanceOf } from '../core';
import { Firestore, FirestoreInstances, FIRESTORE_PROVIDER_NAME } from './firestore';
import { PROVIDED_FIREBASE_APPS } from '../app/app.module';
import { PROVIDED_AUTH_INSTANCES } from '../auth/auth.module';
import { ɵAngularFireSchedulers } from '../zones';

export const PROVIDED_FIRESTORE_INSTANCES = new InjectionToken<Firestore[]>('angularfire2.firestore-instances');

export function ɵdefaultFirestoreInstanceFactory(_: Firestore[]) {
  const defaultFirestore = ɵgetDefaultInstanceOf<FirebaseFirestore>(FIRESTORE_PROVIDER_NAME);
  return new Firestore(defaultFirestore);
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundFirestoreInstanceFactory(zone: NgZone) {
  const firestore = ɵmemoizeInstance<FirebaseFirestore>(this, zone);
  return new Firestore(firestore);
}


const FIRESTORE_INSTANCES_PROVIDER = {
  provide: FirestoreInstances,
  deps: [
    [new Optional(), PROVIDED_AUTH_INSTANCES ],
  ]
};

const DEFAULT_FIRESTORE_INSTANCE_PROVIDER = {
  provide: Firestore,
  useFactory: ɵdefaultFirestoreInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), PROVIDED_FIRESTORE_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_FIRESTORE_INSTANCE_PROVIDER,
    FIRESTORE_INSTANCES_PROVIDER,
  ]
})
export class FirestoreModule {
}

export function provideFirestore(fn: () => FirebaseFirestore): ModuleWithProviders<FirestoreModule> {
  return {
    ngModule: FirestoreModule,
    providers: [{
      provide: PROVIDED_FIRESTORE_INSTANCES,
      useFactory: ɵboundFirestoreInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), PROVIDED_FIREBASE_APPS ],
        // Firestore+Auth work better if Auth is loaded first
        [new Optional(), PROVIDED_AUTH_INSTANCES ],
      ]
    }]
  };
}
