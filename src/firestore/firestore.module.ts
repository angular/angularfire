import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { FirebaseFirestore } from 'firebase/firestore';
import { AuthInstances  } from '@angular/fire/auth';
import { ɵmemoizeInstance, ɵgetDefaultInstanceOf, ɵAngularFireSchedulers } from '@angular/fire';
import { Firestore, FirestoreInstances, FIRESTORE_PROVIDER_NAME } from './firestore';
import { FirebaseApps } from '@angular/fire/app';

export const PROVIDED_FIRESTORE_INSTANCES = new InjectionToken<Firestore[]>('angularfire2.firestore-instances');

export function defaultFirestoreInstanceFactory(_: Firestore[]) {
  const defaultFirestore = ɵgetDefaultInstanceOf<FirebaseFirestore>(FIRESTORE_PROVIDER_NAME);
  return new Firestore(defaultFirestore);
}

export function firestoreInstanceFactory(fn: () => FirebaseFirestore) {
  return (zone: NgZone) => {
    const firestore = ɵmemoizeInstance<FirebaseFirestore>(fn, zone);
    return new Firestore(firestore);
  };
}

const FIRESTORE_INSTANCES_PROVIDER = {
  provide: FirestoreInstances,
  deps: [
    [new Optional(), PROVIDED_FIRESTORE_INSTANCES ],
  ]
};

const DEFAULT_FIRESTORE_INSTANCE_PROVIDER = {
  provide: Firestore,
  useFactory: defaultFirestoreInstanceFactory,
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
      useFactory: firestoreInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        FirebaseApps,
        // Firestore+Auth work better if Auth is loaded first
        [new Optional(), AuthInstances ],
      ]
    }]
  };
}
