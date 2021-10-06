import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, Injector } from '@angular/core';
import { Firestore as FirebaseFirestore } from 'firebase/firestore';
import { AuthInstances  } from '@angular/fire/auth';
import { ɵgetDefaultInstanceOf, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { Firestore, FirestoreInstances, FIRESTORE_PROVIDER_NAME } from './firestore';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';
import { AppCheckInstances } from '@angular/fire/app-check';

export const PROVIDED_FIRESTORE_INSTANCES = new InjectionToken<Firestore[]>('angularfire2.firestore-instances');

export function defaultFirestoreInstanceFactory(provided: FirebaseFirestore[]|undefined, defaultApp: FirebaseApp) {
  const defaultFirestore = ɵgetDefaultInstanceOf<FirebaseFirestore>(FIRESTORE_PROVIDER_NAME, provided, defaultApp);
  return defaultFirestore && new Firestore(defaultFirestore);
}

export function firestoreInstanceFactory(fn: (injector: Injector) => FirebaseFirestore) {
  return (zone: NgZone, injector: Injector) => {
    const firestore = zone.runOutsideAngular(() => fn(injector));
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
  constructor() {
    registerVersion('angularfire', VERSION.full, 'fst');
  }
}

export function provideFirestore(fn: () => FirebaseFirestore, ...deps: any[]): ModuleWithProviders<FirestoreModule> {
  return {
    ngModule: FirestoreModule,
    providers: [{
      provide: PROVIDED_FIRESTORE_INSTANCES,
      useFactory: firestoreInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        ɵAngularFireSchedulers,
        FirebaseApps,
        // Firestore+Auth work better if Auth is loaded first
        [new Optional(), AuthInstances ],
        [new Optional(), AppCheckInstances ],
        ...deps,
      ]
    }]
  };
}
