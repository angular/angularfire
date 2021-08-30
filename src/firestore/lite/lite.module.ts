import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { Firestore as FirebaseFirestore } from 'firebase/firestore/lite';
import { AuthInstances  } from '@angular/fire/auth';
import { ɵmemoizeInstance, ɵgetDefaultInstanceOf, ɵAngularFireSchedulers } from '@angular/fire';
import { Firestore, FirestoreInstances, FIRESTORE_PROVIDER_NAME } from './lite';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';

export const PROVIDED_FIRESTORE_INSTANCES = new InjectionToken<Firestore[]>('angularfire2.firestore-lite-instances');

export function defaultFirestoreInstanceFactory(provided: FirebaseFirestore[]|undefined, defaultApp: FirebaseApp) {
  const defaultFirestore = ɵgetDefaultInstanceOf<FirebaseFirestore>(FIRESTORE_PROVIDER_NAME, provided, defaultApp);
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
    [new Optional(), PROVIDED_FIRESTORE_INSTANCES ],
    FirebaseApp,
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
