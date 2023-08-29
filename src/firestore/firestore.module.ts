import { InjectionToken, Injector, ModuleWithProviders, NgModule, NgZone, Optional } from '@angular/core';
import { VERSION, ɵAngularFireSchedulers, ɵgetDefaultInstanceOf } from '@angular/fire';
import { ɵAppCheckInstances } from '@angular/fire';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { AuthInstances  } from '@angular/fire/auth';
import { registerVersion } from 'firebase/app';
import { Firestore as FirebaseFirestore } from 'firebase/firestore';
import { FIRESTORE_PROVIDER_NAME, Firestore, FirestoreInstances } from './firestore';

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

export function provideFirestore(fn: (injector: Injector) => FirebaseFirestore, ...deps: any[]): ModuleWithProviders<FirestoreModule> {
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
        [new Optional(), ɵAppCheckInstances ],
        ...deps,
      ]
    }]
  };
}
